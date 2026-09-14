"use server";

import { revalidatePath } from "next/cache";

import { exigirSesion, fallo } from "@/lib/admin";
import { BUCKETS } from "@/lib/constants";
import { subirImagen } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import type { ResultadoFormulario } from "@/types";

const TAMANO_MAXIMO = 8 * 1024 * 1024; // 8 MB

/** Tope del texto libre de categoría, para que quepa en una insignia. */
const LARGO_MAXIMO_CATEGORIA = 40;

/** Refresca todo lo que muestra la galería: portada, listado público y panel. */
function revalidarGaleria() {
  revalidatePath("/");
  revalidatePath("/galeria");
  revalidatePath("/admin");
  revalidatePath("/admin/galeria");
}

type CamposFoto = {
  titulo: string;
  descripcion: string | null;
  categoria: string | null;
  destacada: boolean;
};

/** Valida los campos comunes de crear y editar. */
function leerCampos(formData: FormData): CamposFoto | { error: string } {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();

  if (titulo.length < 3) return { error: "El título debe tener al menos 3 caracteres." };

  if (categoria.length > LARGO_MAXIMO_CATEGORIA) {
    return {
      error: `La categoría es demasiado larga (máximo ${LARGO_MAXIMO_CATEGORIA} caracteres).`,
    };
  }

  return {
    titulo,
    descripcion: descripcion || null,
    categoria: categoria || null,
    // Una casilla sin marcar no viaja en el FormData, así que su ausencia
    // es exactamente "destacada: false".
    destacada: formData.get("destacada") === "on",
  };
}

/**
 * Valida un archivo del formulario. Devuelve `null` cuando el campo vino
 * vacío, que en edición significa "conserva la imagen que ya tenía".
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
 * Lee la ruta de Storage tal como está en la base de datos. No usamos
 * `obtenerGaleria()` porque esa consulta ya la convierte en URL pública.
 */
async function rutaGuardada(id: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("galeria")
    .select("imagen_url")
    .eq("id", id)
    .maybeSingle();

  return data?.imagen_url ?? null;
}

/**
 * Limpieza best-effort de Storage: si falla, lo importante (la fila) ya quedó
 * guardado. Descarta URLs completas porque no son rutas del bucket.
 */
async function borrarImagen(ruta: string | null | undefined) {
  if (typeof ruta !== "string" || !ruta || ruta.startsWith("http")) return;

  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKETS.galeria).remove([ruta]);

  if (error) console.error("[san-lazaro] borrarImagen:", error.message);
}

/** Alta de una foto. La imagen es obligatoria: la columna es `not null`. */
export async function crearFoto(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const sinSesion = await exigirSesion();
  if (sinSesion) return fallo(formData, sinSesion.error);

  const campos = leerCampos(formData);
  if ("error" in campos) return fallo(formData, campos.error);

  const imagen = leerImagen(formData.get("imagen"));
  if (!imagen) return fallo(formData, "La imagen es obligatoria.");
  if ("error" in imagen) return fallo(formData, imagen.error);

  // Las carpetas por año mantienen el bucket navegable a medida que crece.
  const subida = await subirImagen(
    BUCKETS.galeria,
    imagen,
    new Date().getFullYear().toString(),
  );

  if ("error" in subida) {
    console.error("[san-lazaro] crearFoto (storage):", subida.error);
    return fallo(formData, "No pudimos subir la imagen. Intenta de nuevo.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("galeria").insert({
    ...campos,
    imagen_url: subida.ruta,
  });

  if (error) {
    console.error("[san-lazaro] crearFoto:", error.message);
    // La fila no existe, así que la imagen recién subida quedaría huérfana.
    await borrarImagen(subida.ruta);
    return fallo(formData, "No pudimos crear la foto. Intenta de nuevo.");
  }

  revalidarGaleria();

  return { ok: true, mensaje: `"${campos.titulo}" agregada a la galería.` };
}

/**
 * Edita una foto. La imagen solo se reemplaza si se envía una nueva; en ese
 * caso la anterior se borra del bucket.
 */
export async function actualizarFoto(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const sinSesion = await exigirSesion();
  if (sinSesion) return fallo(formData, sinSesion.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fallo(formData, "Falta el identificador de la foto.");

  const campos = leerCampos(formData);
  if ("error" in campos) return fallo(formData, campos.error);

  const imagen = leerImagen(formData.get("imagen"));
  if (imagen && "error" in imagen) return fallo(formData, imagen.error);

  let imagenNueva: string | null = null;
  let imagenAnterior: string | null = null;

  if (imagen) {
    imagenAnterior = await rutaGuardada(id);

    const subida = await subirImagen(
      BUCKETS.galeria,
      imagen,
      new Date().getFullYear().toString(),
    );

    if ("error" in subida) {
      console.error("[san-lazaro] actualizarFoto (storage):", subida.error);
      return fallo(formData, "No pudimos subir la imagen. Intenta de nuevo.");
    }

    imagenNueva = subida.ruta;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("galeria")
    .update(imagenNueva ? { ...campos, imagen_url: imagenNueva } : campos)
    .eq("id", id);

  if (error) {
    console.error("[san-lazaro] actualizarFoto:", error.message);
    if (imagenNueva) await borrarImagen(imagenNueva);
    return fallo(formData, "No pudimos guardar los cambios. Intenta de nuevo.");
  }

  if (imagenNueva && imagenAnterior !== imagenNueva) await borrarImagen(imagenAnterior);

  revalidarGaleria();

  return { ok: true, mensaje: "Cambios guardados." };
}

/** Elimina la foto y, después, su imagen del bucket. */
export async function eliminarFoto(formData: FormData): Promise<void> {
  const sinSesion = await exigirSesion();
  if (sinSesion) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  // Leemos la ruta antes de borrar la fila para poder limpiarla después.
  const imagen = await rutaGuardada(id);

  const supabase = await createClient();
  const { error } = await supabase.from("galeria").delete().eq("id", id);

  if (error) {
    console.error("[san-lazaro] eliminarFoto:", error.message);
    return;
  }

  await borrarImagen(imagen);

  revalidarGaleria();
}
