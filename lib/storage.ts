import { SUPABASE_URL } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type Bucket = "mascotas" | "galeria" | "aliados" | "donaciones";

/**
 * En la base de datos guardamos solo la ruta del archivo dentro del bucket
 * (`perros/luna.jpg`). Esta función la convierte en URL pública.
 * Si ya viene una URL completa, la devuelve tal cual.
 */
export function urlPublica(bucket: Bucket, ruta: string | null): string | null {
  if (!ruta) return null;
  if (ruta.startsWith("http://") || ruta.startsWith("https://")) return ruta;
  if (!SUPABASE_URL) return null;

  const limpia = ruta.replace(/^\/+/, "");

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${limpia}`;
}

/** Marcas de acento que deja `normalize("NFD")` (rango combining diacritics). */
const DIACRITICOS = new RegExp("[\\u0300-\\u036f]", "g");

/** Nombre de archivo único y seguro para URLs. */
export function nombreArchivoUnico(nombreOriginal: string): string {
  const extension = nombreOriginal.split(".").pop()?.toLowerCase() ?? "jpg";
  const base = nombreOriginal
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(DIACRITICOS, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 40);

  return `${base || "imagen"}-${Date.now()}.${extension}`;
}

/**
 * Sube una imagen a Supabase Storage desde el servidor y devuelve la ruta
 * guardable en la base de datos. Requiere sesión iniciada (ver políticas RLS).
 */
export async function subirImagen(
  bucket: Bucket,
  archivo: File,
  carpeta = "",
): Promise<{ ruta: string } | { error: string }> {
  const supabase = await createClient();
  const ruta = `${carpeta ? `${carpeta.replace(/\/+$/, "")}/` : ""}${nombreArchivoUnico(archivo.name)}`;

  const { error } = await supabase.storage.from(bucket).upload(ruta, archivo, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) return { error: error.message };

  return { ruta };
}
