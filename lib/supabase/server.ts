import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { credencialesSupabase } from "@/lib/env";
import type { Database } from "@/types";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 *
 * Siempre se crea uno nuevo por request: el cliente guarda la sesión del
 * usuario y no debe compartirse entre peticiones.
 */
export async function createClient() {
  const { url, anonKey } = credencialesSupabase();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Los Server Components no pueden escribir cookies. Es esperado:
          // `proxy.ts` se encarga de refrescar la sesión antes de renderizar.
        }
      },
    },
  });
}

/** Devuelve el usuario autenticado o `null`. Nunca lanza. */
export async function getUsuario() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
