import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigurado } from "@/lib/env";
import type { Database } from "@/types";

/** Rutas que exigen sesión iniciada. */
const RUTAS_PRIVADAS = ["/admin"];

/**
 * Refresca el token de Supabase en cada request y protege las rutas privadas.
 *
 * Se invoca desde `proxy.ts` (la raíz del proyecto), que en Next.js 16 sustituye
 * al antiguo `middleware.ts`.
 */
export async function actualizarSesion(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Sin credenciales no hay sesión que refrescar: deja pasar la petición.
  if (!supabaseConfigurado) return response;

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // No metas lógica entre `createServerClient` y `getUser`: es lo que mantiene
  // la sesión viva y evita cerrar sesiones de forma aleatoria.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const esRutaPrivada = RUTAS_PRIVADAS.some((ruta) =>
    request.nextUrl.pathname.startsWith(ruta),
  );

  if (!user && esRutaPrivada) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", request.nextUrl.pathname);

    return NextResponse.redirect(login);
  }

  return response;
}
