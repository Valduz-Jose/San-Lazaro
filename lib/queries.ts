import "server-only";

import { supabaseConfigurado } from "@/lib/env";
import { urlPublica } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import type {
  Aliado,
  Donacion,
  DonacionConMeta,
  FiltrosMascota,
  FotoGaleria,
  Mascota,
  Meta,
} from "@/types";

/**
 * Consultas de lectura usadas por los Server Components.
 *
 * Todas degradan a vacío si Supabase todavía no está configurado o si la
 * consulta falla, para que el sitio siga renderizando.
 */

export async function obtenerMascotas(filtros: FiltrosMascota = {}): Promise<Mascota[]> {
  if (!supabaseConfigurado) return [];

  const supabase = await createClient();
  let consulta = supabase.from("mascotas").select("*");

  if (filtros.especie) consulta = consulta.eq("especie", filtros.especie);
  if (filtros.estado) consulta = consulta.eq("estado", filtros.estado);
  if (filtros.tamano) consulta = consulta.eq("tamano", filtros.tamano);

  const { data, error } = await consulta.order("created_at", { ascending: false });

  if (error) {
    console.error("[san-lazaro] obtenerMascotas:", error.message);
    return [];
  }

  return (data ?? []).map(conImagenesDeMascota);
}

export async function obtenerMascota(id: string): Promise<Mascota | null> {
  if (!supabaseConfigurado) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mascotas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[san-lazaro] obtenerMascota:", error.message);
    return null;
  }

  return data ? conImagenesDeMascota(data) : null;
}

/**
 * Aliados de la fundación. Por defecto solo los activos, que son los únicos
 * que la política RLS pública deja ver; el panel pide también los inactivos.
 */
export async function obtenerAliados(soloActivos = true): Promise<Aliado[]> {
  if (!supabaseConfigurado) return [];

  const supabase = await createClient();
  let consulta = supabase.from("aliados").select("*");

  if (soloActivos) consulta = consulta.eq("activo", true);

  const { data, error } = await consulta.order("nombre");

  if (error) {
    console.error("[san-lazaro] obtenerAliados:", error.message);
    return [];
  }

  return (data ?? []).map((aliado) => ({
    ...aliado,
    logo_url: urlPublica("aliados", aliado.logo_url),
  }));
}

export async function obtenerGaleria(limite?: number): Promise<FotoGaleria[]> {
  if (!supabaseConfigurado) return [];

  const supabase = await createClient();
  let consulta = supabase
    .from("galeria")
    .select("*")
    .order("destacada", { ascending: false })
    .order("created_at", { ascending: false });

  if (limite) consulta = consulta.limit(limite);

  const { data, error } = await consulta;

  if (error) {
    console.error("[san-lazaro] obtenerGaleria:", error.message);
    return [];
  }

  return (data ?? []).map((foto) => ({
    ...foto,
    imagen_url: urlPublica("galeria", foto.imagen_url) ?? "",
  }));
}

/** Metas del refugio. Por defecto solo las activas. */
export async function obtenerMetas(soloActivas = true): Promise<Meta[]> {
  if (!supabaseConfigurado) return [];

  const supabase = await createClient();
  let consulta = supabase.from("metas").select("*");

  if (soloActivas) consulta = consulta.eq("estado", "activa");

  const { data, error } = await consulta.order("created_at", { ascending: true });

  if (error) {
    console.error("[san-lazaro] obtenerMetas:", error.message);
    return [];
  }

  return data ?? [];
}

export async function obtenerMeta(id: string): Promise<Meta | null> {
  if (!supabaseConfigurado) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.from("metas").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("[san-lazaro] obtenerMeta:", error.message);
    return null;
  }

  return data;
}

/** Historial público de una meta, de la donación más reciente a la más antigua. */
export async function obtenerDonacionesDeMeta(metaId: string): Promise<Donacion[]> {
  if (!supabaseConfigurado) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donaciones")
    .select("*")
    .eq("meta_id", metaId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[san-lazaro] obtenerDonacionesDeMeta:", error.message);
    return [];
  }

  return (data ?? []).map(conImagenDeDonacion);
}

/** Últimas donaciones registradas, con el título de su meta. Para el panel. */
export async function obtenerDonacionesRecientes(limite = 20): Promise<DonacionConMeta[]> {
  if (!supabaseConfigurado) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donaciones")
    .select("*, meta:metas(titulo, unidad)")
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("[san-lazaro] obtenerDonacionesRecientes:", error.message);
    return [];
  }

  return (data ?? []).map((donacion) => ({
    ...conImagenDeDonacion(donacion),
    meta: donacion.meta ?? { titulo: "Meta eliminada", unidad: "" },
  }));
}

/** Contadores para la portada y el panel de administración. */
export async function obtenerResumen() {
  const vacio = { enAdopcion: 0, adoptados: 0, aliados: 0, fotos: 0, metasActivas: 0 };

  if (!supabaseConfigurado) return vacio;

  const supabase = await createClient();
  const cabecera = { count: "exact" as const, head: true };

  const [enAdopcion, adoptados, aliados, fotos, metasActivas] = await Promise.all([
    supabase.from("mascotas").select("*", cabecera).eq("estado", "en_adopcion"),
    supabase.from("mascotas").select("*", cabecera).eq("estado", "adoptado"),
    supabase.from("aliados").select("*", cabecera).eq("activo", true),
    supabase.from("galeria").select("*", cabecera),
    supabase.from("metas").select("*", cabecera).eq("estado", "activa"),
  ]);

  return {
    enAdopcion: enAdopcion.count ?? 0,
    adoptados: adoptados.count ?? 0,
    aliados: aliados.count ?? 0,
    fotos: fotos.count ?? 0,
    metasActivas: metasActivas.count ?? 0,
  };
}

/** Resuelve las URLs públicas de las dos fotos de una mascota. */
function conImagenesDeMascota(fila: Mascota): Mascota {
  return {
    ...fila,
    imagen_url: urlPublica("mascotas", fila.imagen_url),
    imagen_familia_url: urlPublica("mascotas", fila.imagen_familia_url),
  };
}

function conImagenDeDonacion<T extends { imagen_url: string }>(fila: T): T {
  return { ...fila, imagen_url: urlPublica("donaciones", fila.imagen_url) ?? "" };
}
