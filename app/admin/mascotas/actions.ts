"use server";

import { revalidatePath } from "next/cache";

import { exigirSesion, fallo } from "@/lib/admin";
import { BUCKETS } from "@/lib/constants";
import { subirImagen } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import type {
  EspecieMascota,
  ResultadoFormulario,
  SexoMascota,
  TamanoMascota,
} from "@/types";

const TAMANO_MAXIMO = 8 * 1024 * 1024; // 8 MB

const ESPECIES: EspecieMascota[] = ["perro", "gato", "otro"];
const SEXOS: SexoMascota[] = ["macho", "hembra"];
const TAMANOS: TamanoMascota[] = ["pequeno", "mediano", "grande"];

/** Carpeta del bucket `mascotas` donde vive la foto principal de cada especie. */
const CARPETA_ESPECIE: Record<EspecieMascota, string> = {
  perro: "perros",
  gato: "gatos",
  otro: "otros",
};

/** Las fotos con la nueva familia van aparte para no mezclarlas con las fichas. */
const CARPETA_FAMILIAS = "familias";

/** Edad máxima aceptada, en meses (50 años). Atrapa erratas tipo "2024". */
const EDAD_MAXIMA_MESES = 600;

/** Refresca todo lo que muestra mascotas: portada, adopciones y panel. */
function revalidarMascotas(mascotaId?: string) {
  revalidatePath("/");
  revalidatePath("/adopciones");
  revalidatePath("/admin");
  revalidatePath("/admin/mascotas");
  if (mascotaId) revalidatePath(`/adopciones/${mascotaId}`);
}

type CamposMascota = {
  nombre: string;
  especie: EspecieMascota;
  sexo: SexoMascota;
  raza: string | null;
  edad_meses: number | null;
  tamano: TamanoMascota | null;
  descripcion: string;
  historia: string | null;
  esterilizado: boolean;
  vacunado: boolean;
  fecha_rescate: string | null;
};

/** Valida los campos comunes de crear y editar. */
function leerCampos(formData: FormData): CamposMascota | { error: string } {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const especie = String(formData.get("especie") ?? "").trim();
  const sexo = String(formData.get("sexo") ?? "").trim();
  const raza = String(formData.get("raza") ?? "").trim();
  const edadBruta = String(formData.get("edad_meses") ?? "").trim();
  const tamano = String(formData.get("tamano") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const historia = String(formData.get("historia") ?? "").trim();
  const fechaRescate = String(formData.get("fecha_rescate") ?? "").trim();

  if (nombre.length < 2) return { error: "El nombre debe tener al menos 2 caracteres." };

  if (!ESPECIES.includes(especie as EspecieMascota)) {
    return { error: "Selecciona una especie válida (perro, gato u otro)." };
  }

  if (!SEXOS.includes(sexo as SexoMascota)) {
    return { error: "Selecciona el sexo de la mascota." };
  }

  if (tamano && !TAMANOS.includes(tamano as TamanoMascota)) {
    return { error: "El tamaño seleccionado no es válido." };
  }

  if (descripcion.length < 10) {
    return { error: "La descripción debe tener al menos 10 caracteres." };
  }

  let edadMeses: number | null = null;
  if (edadBruta) {
    const edad = Number(edadBruta);

    if (!Number.isInteger(edad) || edad < 0 || edad > EDAD_MAXIMA_MESES) {
      return { error: "La edad debe ser un número entero de meses entre 0 y 600." };
    }

    edadMeses = edad;
  }

  // `<input type="date">` siempre manda AAAA-MM-DD; lo validamos por si el POST
  // llega desde fuera del formulario.
  if (fechaRescate && !/^\d{4}-\d{2}-\d{2}$/.test(fechaRescate)) {
    return { error: "La fecha de rescate no tiene un formato válido." };
  }

  return {
    nombre,
    especie: especie as EspecieMascota,
    sexo: sexo as SexoMascota,
    raza: raza || null,
    edad_meses: edadMeses,
    tamano: (tamano as TamanoMascota) || null,
    descripcion,
    historia: historia || null,
    esterilizado: formData.get("esterilizado") === "on",
    vacunado: formData.get("vacunado") === "on",
    fecha_rescate: fechaRescate || null,
  };
}

/**
 * Valida un archivo del formulario. Devuelve `null` cuando el campo vino
 * vacío, que en edición significa "conserva la foto que ya tenía".
 */
function leerImagen(valor: FormDataEntryValue | null): File | null | { error: string } {
  if (!(valor instanceof File) || valor.size === 0) return null;

  if (!valor.type.startsWith("image/")) {
    return { error: "El archivo debe ser una imagen." };
  }

  if (valor.size > TAMANO_MAXIMO) {
    return { error: "La imagen supera los 8 MB. Usa una más liviana." };
  }

  return valor;
}

/**
 * Lee las rutas de Storage tal como están en la base de datos. No usamos
 * `obtenerMascota()` porque esa consulta ya las convierte en URL pública.
 */
async function rutasGuardadas(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mascotas")
    .select("imagen_url, imagen_familia_url")
    .eq("id", id)
    .maybeSingle();

  return data;
}

/**
 * Limpieza best-effort de Storage: si falla, lo importante (la fila) ya quedó
 * guardado. Descarta URLs completas porque no son rutas del bucket.
 */
async function borrarImagenes(rutas: Array<string | null | undefined>) {
  const limpias = rutas.filter(
    (ruta): ruta is string =>
      typeof ruta === "string" && ruta.length > 0 && !ruta.startsWith("http"),
  );

  if (limpias.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKETS.mascotas).remove(limpias);

  if (error) console.error("[san-lazaro] borrarImagenes:", error.message);
}

/** Alta de una ficha. El estado siempre arranca en 'en_adopcion'. */
export async function crearMascota(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const sinSesion = await exigirSesion();
  if (sinSesion) return fallo(formData, sinSesion.error);

  const campos = leerCampos(formData);
  if ("error" in campos) return fallo(formData, campos.error);

  const imagen = leerImagen(formData.get("imagen"));
  if (!imagen) return fallo(formData, "La foto principal es obligatoria.");
  if ("error" in imagen) return fallo(formData, imagen.error);

  const subida = await subirImagen(
    BUCKETS.mascotas,
    imagen,
    CARPETA_ESPECIE[campos.especie],
  );

  if ("error" in subida) {
    console.error("[san-lazaro] crearMascota (storage):", subida.error);
    return fallo(formData, "No pudimos subir la imagen. Intenta de nuevo.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("mascotas").insert({
    ...campos,
    estado: "en_adopcion",
    imagen_url: subida.ruta,
  });

  if (error) {
    console.error("[san-lazaro] crearMascota:", error.message);
    // La fila no existe, así que la imagen recién subida quedaría huérfana.
    await borrarImagenes([subida.ruta]);
    return fallo(formData, "No pudimos crear la ficha. Intenta de nuevo.");
  }

  revalidarMascotas();

  return { ok: true, mensaje: `Ficha de ${campos.nombre} creada.` };
}

/**
 * Edita una ficha. La foto principal solo se reemplaza si se envía una nueva;
 * en ese caso la anterior se borra del bucket.
 */
export async function actualizarMascota(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const sinSesion = await exigirSesion();
  if (sinSesion) return fallo(formData, sinSesion.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fallo(formData, "Falta el identificador de la mascota.");

  const campos = leerCampos(formData);
  if ("error" in campos) return fallo(formData, campos.error);

  const imagen = leerImagen(formData.get("imagen"));
  if (imagen && "error" in imagen) return fallo(formData, imagen.error);

  let imagenNueva: string | null = null;
  let imagenAnterior: string | null = null;

  if (imagen) {
    imagenAnterior = (await rutasGuardadas(id))?.imagen_url ?? null;

    const subida = await subirImagen(
      BUCKETS.mascotas,
      imagen,
      CARPETA_ESPECIE[campos.especie],
    );

    if ("error" in subida) {
      console.error("[san-lazaro] actualizarMascota (storage):", subida.error);
      return fallo(formData, "No pudimos subir la imagen. Intenta de nuevo.");
    }

    imagenNueva = subida.ruta;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("mascotas")
    .update(imagenNueva ? { ...campos, imagen_url: imagenNueva } : campos)
    .eq("id", id);

  if (error) {
    console.error("[san-lazaro] actualizarMascota:", error.message);
    if (imagenNueva) await borrarImagenes([imagenNueva]);
    return fallo(formData, "No pudimos guardar los cambios. Intenta de nuevo.");
  }

  if (imagenNueva && imagenAnterior !== imagenNueva) {
    await borrarImagenes([imagenAnterior]);
  }

  revalidarMascotas(id);

  return { ok: true, mensaje: "Cambios guardados." };
}

/**
 * Cierra la adopción: exige la foto con la nueva familia y pasa el estado a
 * 'adoptado'. Sin foto no hay cambio de estado.
 */
export async function marcarAdoptado(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const sinSesion = await exigirSesion();
  if (sinSesion) return { ok: false, error: sinSesion.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Falta el identificador de la mascota." };

  const imagen = leerImagen(formData.get("imagen_familia"));
  if (!imagen) return { ok: false, error: "La foto con la nueva familia es obligatoria." };
  if ("error" in imagen) return { ok: false, error: imagen.error };

  const anterior = (await rutasGuardadas(id))?.imagen_familia_url ?? null;

  const subida = await subirImagen(BUCKETS.mascotas, imagen, CARPETA_FAMILIAS);

  if ("error" in subida) {
    console.error("[san-lazaro] marcarAdoptado (storage):", subida.error);
    return { ok: false, error: "No pudimos subir la imagen. Intenta de nuevo." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("mascotas")
    .update({ estado: "adoptado", imagen_familia_url: subida.ruta })
    .eq("id", id);

  if (error) {
    console.error("[san-lazaro] marcarAdoptado:", error.message);
    await borrarImagenes([subida.ruta]);
    return { ok: false, error: "No pudimos registrar la adopción. Intenta de nuevo." };
  }

  if (anterior !== subida.ruta) await borrarImagenes([anterior]);

  revalidarMascotas(id);

  return { ok: true, mensaje: "Adopción registrada. La ficha ya aparece como adoptada." };
}

/**
 * Deshace una adopción marcada por error: vuelve a 'en_adopcion' y borra la
 * foto con la familia, que ya no corresponde.
 */
export async function revertirAdopcion(formData: FormData): Promise<void> {
  const sinSesion = await exigirSesion();
  if (sinSesion) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const anterior = (await rutasGuardadas(id))?.imagen_familia_url ?? null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("mascotas")
    .update({ estado: "en_adopcion", imagen_familia_url: null })
    .eq("id", id);

  if (error) {
    console.error("[san-lazaro] revertirAdopcion:", error.message);
    return;
  }

  await borrarImagenes([anterior]);

  revalidarMascotas(id);
}

/** Elimina la ficha y, después, sus imágenes del bucket. */
export async function eliminarMascota(formData: FormData): Promise<void> {
  const sinSesion = await exigirSesion();
  if (sinSesion) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  // Leemos las rutas antes de borrar la fila para poder limpiarlas después.
  const rutas = await rutasGuardadas(id);

  const supabase = await createClient();
  const { error } = await supabase.from("mascotas").delete().eq("id", id);

  if (error) {
    console.error("[san-lazaro] eliminarMascota:", error.message);
    return;
  }

  await borrarImagenes([rutas?.imagen_url, rutas?.imagen_familia_url]);

  revalidarMascotas(id);
}
