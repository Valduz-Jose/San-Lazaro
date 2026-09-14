import "server-only";

import { supabaseConfigurado } from "@/lib/env";
import { getUsuario } from "@/lib/supabase/server";
import { valoresEnviados } from "@/lib/utils";
import type { ResultadoFormulario } from "@/types";

/**
 * Piezas que comparten las server actions del panel (`/admin/metas`,
 * `/admin/mascotas`, `/admin/aliados`). Este archivo no lleva `"use server"`:
 * no expone actions, solo ayudantes que ellas usan, así que puede exportar
 * funciones síncronas.
 */

/** Comprueba entorno y sesión. Devuelve el error listo para el formulario. */
export async function exigirSesion(): Promise<{ error: string } | null> {
  if (!supabaseConfigurado) {
    return { error: "Supabase no está configurado. Completa .env.local." };
  }

  const usuario = await getUsuario();
  if (!usuario) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  return null;
}

/**
 * Error de validación que conserva lo que el usuario ya había escrito: React
 * resetea el formulario al terminar la action, así que sin devolver los
 * valores se perderían los cambios a medio hacer.
 */
export function fallo(formData: FormData, error: string): ResultadoFormulario {
  return { ok: false, error, valores: valoresEnviados(formData) };
}
