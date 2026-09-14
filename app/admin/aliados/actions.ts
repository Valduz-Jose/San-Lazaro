"use server";

import { revalidatePath } from "next/cache";

import { exigirSesion, fallo } from "@/lib/admin";
import { BUCKETS } from "@/lib/constants";
import { subirImagen } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import type { ResultadoFormulario, TipoAliado } from "@/types";

const TAMANO_MAXIMO = 8 * 1024 * 1024; // 8 MB

const TIPOS: TipoAliado[] = ["veterinaria", "empresa", "refugio", "particular"];

/** Refresca todo lo que muestra aliados: portada, listado público y panel. */
function revalidarAliados() {
  revalidatePath("/");
  revalidatePath("/aliados");
  revalidatePath("/admin");
  revalidatePath("/admin/aliados");
}

const ERROR_SITIO_WEB =
  "El sitio web no es una URL válida (por ejemplo, https://clinicasanjose.com).";

/**
 * Normaliza y valida el sitio web. Aceptamos que escriban "clinica.com" y le
 * ponemos el esquema: `AliadoCard` usa el valor tal cual en un `href`, y sin
 * `https://` el navegador lo tomaría como una ruta relativa del propio sitio.
 */
function leerSitioWeb(valor: string): { sitio: string | null } | { error: string } {
  if (!valor) return { sitio: null };

  // Si no trae esquema se lo añadimos; si trae uno raro (`javascript:`), al
  // anteponer `https://` deja de ser ejecutable y `new URL` lo rechaza.
  const conEsquema = /^https?:\/\//i.test(valor) ? valor : `https://${valor}`;

  let url: URL;
  try {
    url = new URL(conEsquema);
  } catch {
    return { error: ERROR_SITIO_WEB };
  }

  if (!url.hostname.includes(".")) return { error: ERROR_SITIO_WEB };

  // Guardamos lo que escribieron más el esquema, no `url.toString()`, que
  // añadiría una barra final al dominio desnudo.
  return { sitio: conEsquema };
}

type CamposAliado = {
  nombre: string;
  tipo: TipoAliado;
  descripcion: string | null;
  sitio_web: string | null;
};

/** Valida los campos comunes de crear y editar. */
function leerCampos(formData: FormData): CamposAliado | { error: string } {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const sitioWebBruto = String(formData.get("sitio_web") ?? "").trim();

  if (nombre.length < 2) return { error: "El nombre debe tener al menos 2 caracteres." };

  if (!TIPOS.includes(tipo as TipoAliado)) {
    return { error: "Selecciona un tipo válido (veterinaria, empresa, refugio o particular)." };
  }

  const sitioWeb = leerSitioWeb(sitioWebBruto);
  if ("error" in sitioWeb) return { error: sitioWeb.error };

  return {
    nombre,
    tipo: tipo as TipoAliado,
    descripcion: descripcion || null,
    sitio_web: sitioWeb.sitio,
  };
}

/**
 * Valida un archivo del formulario. Devuelve `null` cuando el campo vino
 * vacío, que en edición significa "conserva el logo que ya tenía".
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
 * `obtenerAliados()` porque esa consulta ya la convierte en URL pública.
 */
async function rutaGuardada(id: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("aliados")
    .select("logo_url")
    .eq("id", id)
    .maybeSingle();

  return data?.logo_url ?? null;
}

/**
 * Limpieza best-effort de Storage: si falla, lo importante (la fila) ya quedó
 * guardado. Descarta URLs completas porque no son rutas del bucket.
 */
async function borrarLogo(ruta: string | null | undefined) {
  if (typeof ruta !== "string" || !ruta || ruta.startsWith("http")) return;

  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKETS.aliados).remove([ruta]);

  if (error) console.error("[san-lazaro] borrarLogo:", error.message);
}

/** Alta de un aliado. `activo` arranca en true para que salga ya en /aliados. */
export async function crearAliado(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const sinSesion = await exigirSesion();
  if (sinSesion) return fallo(formData, sinSesion.error);

  const campos = leerCampos(formData);
  if ("error" in campos) return fallo(formData, campos.error);

  const logo = leerImagen(formData.get("logo"));
  if (!logo) return fallo(formData, "El logo es obligatorio.");
  if ("error" in logo) return fallo(formData, logo.error);

  const subida = await subirImagen(BUCKETS.aliados, logo);

  if ("error" in subida) {
    console.error("[san-lazaro] crearAliado (storage):", subida.error);
    return fallo(formData, "No pudimos subir el logo. Intenta de nuevo.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("aliados").insert({
    ...campos,
    activo: true,
    logo_url: subida.ruta,
  });

  if (error) {
    console.error("[san-lazaro] crearAliado:", error.message);
    // La fila no existe, así que el logo recién subido quedaría huérfano.
    await borrarLogo(subida.ruta);
    return fallo(formData, "No pudimos crear el aliado. Intenta de nuevo.");
  }

  revalidarAliados();

  return { ok: true, mensaje: `${campos.nombre} agregado a los aliados.` };
}

/**
 * Edita un aliado. El logo solo se reemplaza si se envía uno nuevo; en ese
 * caso el anterior se borra del bucket. No toca `activo`: eso es el toggle.
 */
export async function actualizarAliado(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const sinSesion = await exigirSesion();
  if (sinSesion) return fallo(formData, sinSesion.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fallo(formData, "Falta el identificador del aliado.");

  const campos = leerCampos(formData);
  if ("error" in campos) return fallo(formData, campos.error);

  const logo = leerImagen(formData.get("logo"));
  if (logo && "error" in logo) return fallo(formData, logo.error);

  let logoNuevo: string | null = null;
  let logoAnterior: string | null = null;

  if (logo) {
    logoAnterior = await rutaGuardada(id);

    const subida = await subirImagen(BUCKETS.aliados, logo);

    if ("error" in subida) {
      console.error("[san-lazaro] actualizarAliado (storage):", subida.error);
      return fallo(formData, "No pudimos subir el logo. Intenta de nuevo.");
    }

    logoNuevo = subida.ruta;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("aliados")
    .update(logoNuevo ? { ...campos, logo_url: logoNuevo } : campos)
    .eq("id", id);

  if (error) {
    console.error("[san-lazaro] actualizarAliado:", error.message);
    if (logoNuevo) await borrarLogo(logoNuevo);
    return fallo(formData, "No pudimos guardar los cambios. Intenta de nuevo.");
  }

  if (logoNuevo && logoAnterior !== logoNuevo) await borrarLogo(logoAnterior);

  revalidarAliados();

  return { ok: true, mensaje: "Cambios guardados." };
}

/**
 * Activa o desactiva un aliado sin pasar por el formulario completo.
 * Desactivarlo lo saca de `/aliados` (la política RLS pública solo deja ver
 * los activos) pero conserva la ficha y el logo.
 */
export async function cambiarActivoAliado(formData: FormData): Promise<void> {
  const sinSesion = await exigirSesion();
  if (sinSesion) return;

  const id = String(formData.get("id") ?? "").trim();
  const activo = String(formData.get("activo") ?? "").trim();

  if (!id || (activo !== "true" && activo !== "false")) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("aliados")
    .update({ activo: activo === "true" })
    .eq("id", id);

  if (error) {
    console.error("[san-lazaro] cambiarActivoAliado:", error.message);
    return;
  }

  revalidarAliados();
}

/** Elimina el aliado y, después, su logo del bucket. */
export async function eliminarAliado(formData: FormData): Promise<void> {
  const sinSesion = await exigirSesion();
  if (sinSesion) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  // Leemos la ruta antes de borrar la fila para poder limpiarla después.
  const logo = await rutaGuardada(id);

  const supabase = await createClient();
  const { error } = await supabase.from("aliados").delete().eq("id", id);

  if (error) {
    console.error("[san-lazaro] eliminarAliado:", error.message);
    return;
  }

  await borrarLogo(logo);

  revalidarAliados();
}
