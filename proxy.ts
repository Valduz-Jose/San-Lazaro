import type { NextRequest } from "next/server";

import { actualizarSesion } from "@/lib/supabase/proxy";

/**
 * En Next.js 16 este archivo reemplaza a `middleware.ts`.
 * Refresca la sesión de Supabase en cada navegación y protege `/admin`.
 */
export async function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  matcher: [
    /*
     * Todas las rutas menos:
     * - _next/static, _next/image (assets del build)
     * - favicon y archivos de imagen estáticos
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
