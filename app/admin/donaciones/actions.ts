"use server";

import { revalidatePath } from "next/cache";

import { BUCKETS } from "@/lib/constants";
import { supabaseConfigurado } from "@/lib/env";
import { subirImagen } from "@/lib/storage";
import { createClient, getUsuario } from "@/lib/supabase/server";
import type { ResultadoFormulario } from "@/types";

const TAMANO_MAXIMO = 8 * 1024 * 1024; // 8 MB

/** Refresca las vistas que muestran metas y donaciones. */
function revalidarDonaciones(metaId?: string) {
  revalidatePath("/donaciones");
  revalidatePath("/admin/donaciones");
  if (metaId) revalidatePath(`/donaciones/${metaId}`);
}

/**
 * Registra una donación en especie. Solo el equipo autenticado puede hacerlo:
 * las políticas RLS de `donaciones` no permiten INSERT a usuarios anónimos.
 */
export async function registrarDonacion(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  if (!supabaseConfigurado) {
    return { ok: false, error: "Supabase no está configurado. Completa .env.local." };
  }

  const usuario = await getUsuario();
  if (!usuario) return { ok: false, error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const metaId = String(formData.get("meta_id") ?? "").trim();
  const esAnonima = formData.get("es_anonima") === "on";
  const nombre = String(formData.get("donante_nombre") ?? "").trim();
  const cantidadBruta = String(formData.get("cantidad") ?? "").trim();
  const imagen = formData.get("imagen");

  if (!metaId) return { ok: false, error: "Selecciona la meta que recibe la donación." };

  if (!esAnonima && nombre.length < 2) {
    return {
      ok: false,
      error: "Escribe el nombre del donante o marca la donación como anónima.",
    };
  }

  const cantidad = Number(cantidadBruta);
  if (!cantidadBruta || Number.isNaN(cantidad) || cantidad <= 0) {
    return { ok: false, error: "La cantidad debe ser un número mayor a cero." };
  }

  if (!(imagen instanceof File) || imagen.size === 0) {
    return { ok: false, error: "La foto de la donación es obligatoria." };
  }

  if (!imagen.type.startsWith("image/")) {
    return { ok: false, error: "El archivo debe ser una imagen." };
  }

  if (imagen.size > TAMANO_MAXIMO) {
    return { ok: false, error: "La imagen supera los 8 MB. Usa una más liviana." };
  }

  const subida = await subirImagen(BUCKETS.donaciones, imagen, new Date().getFullYear().toString());

  if ("error" in subida) {
    console.error("[san-lazaro] subirImagen:", subida.error);
    return { ok: false, error: "No pudimos subir la imagen. Intenta de nuevo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("donaciones").insert({
    meta_id: metaId,
    donante_nombre: esAnonima ? null : nombre,
    es_anonima: esAnonima,
    cantidad,
    imagen_url: subida.ruta,
  });

  if (error) {
    console.error("[san-lazaro] registrarDonacion:", error.message);
    return { ok: false, error: "No pudimos registrar la donación. Intenta de nuevo." };
  }

  revalidarDonaciones(metaId);

  return { ok: true, mensaje: "Donación registrada. La meta ya refleja el nuevo total." };
}

/**
 * Elimina una donación mal cargada. El trigger de la base de datos descuenta la
 * cantidad del `monto_actual` de la meta automáticamente.
 */
export async function eliminarDonacion(formData: FormData): Promise<void> {
  if (!supabaseConfigurado) return;

  const usuario = await getUsuario();
  if (!usuario) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();

  // Leemos la ruta de la imagen antes de borrar la fila para poder limpiarla.
  const { data: donacion } = await supabase
    .from("donaciones")
    .select("imagen_url, meta_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("donaciones").delete().eq("id", id);

  if (error) {
    console.error("[san-lazaro] eliminarDonacion:", error.message);
    return;
  }

  // Limpieza best-effort: si falla, la fila ya se eliminó y eso es lo importante.
  if (donacion?.imagen_url) {
    const { error: errorStorage } = await supabase.storage
      .from(BUCKETS.donaciones)
      .remove([donacion.imagen_url]);

    if (errorStorage) {
      console.error("[san-lazaro] eliminarDonacion (storage):", errorStorage.message);
    }
  }

  revalidarDonaciones(donacion?.meta_id);
}
