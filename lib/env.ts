/**
 * Lectura centralizada de las variables de entorno de Supabase.
 *
 * El proyecto arranca aunque falten: las páginas muestran un aviso de
 * "configura Supabase" en lugar de reventar, para que `npm run dev` funcione
 * antes de tener las llaves.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** `true` cuando `.env.local` tiene ambas variables con valor. */
export const supabaseConfigurado = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

/**
 * Devuelve las credenciales o lanza un error claro.
 * Úsalo solo donde no puedas degradar la experiencia (crear un cliente real).
 */
export function credencialesSupabase(): { url: string; anonKey: string } {
  if (!supabaseConfigurado) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copia .env.local.example a .env.local y completa los valores.",
    );
  }

  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}
