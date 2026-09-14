"use server";

import { revalidatePath } from "next/cache";

import { exigirSesion, fallo } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import type { CategoriaMeta, EstadoMeta, ResultadoFormulario } from "@/types";

const CATEGORIAS: CategoriaMeta[] = ["materiales", "alimento", "camas", "salud", "otro"];
const ESTADOS: EstadoMeta[] = ["activa", "cumplida", "archivada"];

/**
 * Refresca todo lo que depende de las metas. Incluye `/admin/donaciones`
 * para que su desplegable muestre las metas activas recién creadas sin
 * que haya que recargar la página a mano.
 */
function revalidarMetas(metaId?: string) {
  revalidatePath("/admin/metas");
  revalidatePath("/admin/donaciones");
  revalidatePath("/donaciones");
  if (metaId) revalidatePath(`/donaciones/${metaId}`);
}

type CamposMeta = {
  titulo: string;
  descripcion: string | null;
  categoria: CategoriaMeta | null;
  unidad: string;
  monto_objetivo: number;
};

/** Valida los campos comunes de crear y editar. */
function leerCampos(formData: FormData): CamposMeta | { error: string } {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const categoriaBruta = String(formData.get("categoria") ?? "").trim();
  const unidad = String(formData.get("unidad") ?? "").trim();
  const objetivoBruto = String(formData.get("monto_objetivo") ?? "").trim();

  if (titulo.length < 3) return { error: "El título debe tener al menos 3 caracteres." };
  if (!unidad) return { error: "Indica la unidad de medida (kg, unidades, sacos…)." };
  if (unidad.length > 20) return { error: "La unidad es demasiado larga (máximo 20 caracteres)." };

  if (categoriaBruta && !CATEGORIAS.includes(categoriaBruta as CategoriaMeta)) {
    return { error: "La categoría seleccionada no es válida." };
  }

  const montoObjetivo = Number(objetivoBruto);
  if (!objetivoBruto || Number.isNaN(montoObjetivo) || montoObjetivo <= 0) {
    return { error: "El objetivo debe ser un número mayor a cero." };
  }

  return {
    titulo,
    descripcion: descripcion || null,
    categoria: (categoriaBruta as CategoriaMeta) || null,
    unidad,
    monto_objetivo: montoObjetivo,
  };
}

/**
 * Crea una meta nueva. `monto_actual` arranca en 0 (valor por defecto de la
 * tabla) y solo lo mueve el trigger de donaciones.
 */
export async function crearMeta(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const sinSesion = await exigirSesion();
  if (sinSesion) return fallo(formData, sinSesion.error);

  const campos = leerCampos(formData);
  if ("error" in campos) return fallo(formData, campos.error);

  const supabase = await createClient();
  const { error } = await supabase.from("metas").insert(campos);

  if (error) {
    console.error("[san-lazaro] crearMeta:", error.message);
    return fallo(formData, "No pudimos crear la meta. Intenta de nuevo.");
  }

  revalidarMetas();

  return { ok: true, mensaje: `Meta "${campos.titulo}" creada.` };
}

/** Edita los datos de una meta. No toca `monto_actual` ni `estado`. */
export async function actualizarMeta(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const sinSesion = await exigirSesion();
  if (sinSesion) return fallo(formData, sinSesion.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fallo(formData, "Falta el identificador de la meta.");

  const campos = leerCampos(formData);
  if ("error" in campos) return fallo(formData, campos.error);

  const supabase = await createClient();
  const { error } = await supabase.from("metas").update(campos).eq("id", id);

  if (error) {
    console.error("[san-lazaro] actualizarMeta:", error.message);
    return fallo(formData, "No pudimos guardar los cambios. Intenta de nuevo.");
  }

  revalidarMetas(id);

  return { ok: true, mensaje: "Cambios guardados." };
}

/** Cambia el estado entre 'activa', 'cumplida' y 'archivada'. */
export async function cambiarEstadoMeta(formData: FormData): Promise<void> {
  const sinSesion = await exigirSesion();
  if (sinSesion) return;

  const id = String(formData.get("id") ?? "").trim();
  const estado = String(formData.get("estado") ?? "").trim() as EstadoMeta;

  if (!id || !ESTADOS.includes(estado)) return;

  const supabase = await createClient();
  const { error } = await supabase.from("metas").update({ estado }).eq("id", id);

  if (error) {
    console.error("[san-lazaro] cambiarEstadoMeta:", error.message);
    return;
  }

  revalidarMetas(id);
}

/**
 * Elimina una meta. El `on delete cascade` del esquema borra también sus
 * donaciones, así que la UI avisa antes de confirmar.
 */
export async function eliminarMeta(formData: FormData): Promise<void> {
  const sinSesion = await exigirSesion();
  if (sinSesion) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("metas").delete().eq("id", id);

  if (error) {
    console.error("[san-lazaro] eliminarMeta:", error.message);
    return;
  }

  revalidarMetas(id);
}
