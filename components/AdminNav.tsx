"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cerrarSesion } from "@/app/login/actions";
import { NAVEGACION_ADMIN } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Barra del panel. Es oscura a propósito: deja claro de un vistazo que lo que
 * se ve abajo es la vista interna y no el sitio público.
 *
 * En móvil las pestañas no colapsan en un menú: la fila se desplaza con swipe
 * (ver la utilidad `sin-barra-scroll`) para que todos los módulos sigan a un
 * toque de distancia.
 */
export function AdminNav({ email }: { email: string | null }) {
  const pathname = usePathname();

  const esActiva = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <Link
          href="/admin"
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-md px-1 py-1 text-sm font-bold transition-colors",
            pathname === "/admin" ? "text-white" : "text-slate-300 hover:text-white",
          )}
        >
          <span className="grid size-6 place-items-center rounded bg-emerald-600 text-[11px] font-bold text-white">
            SL
          </span>
          Panel
        </Link>

        {/*
          En móvil las pestañas ocupan su propia fila completa (`order-last
          w-full`); en escritorio vuelven al orden natural, entre el logo y la
          sesión.
        */}
        <nav
          aria-label="Secciones del panel"
          className="sin-barra-scroll order-last -mx-1 w-full overflow-x-auto px-1 md:order-none md:mx-0 md:w-auto md:px-0"
        >
          <div className="flex gap-1">
            {NAVEGACION_ADMIN.map((item) => {
              const activa = esActiva(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={activa ? "page" : undefined}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    activa
                      ? "bg-white text-slate-900"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white",
                  )}
                >
                  {item.etiqueta}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {email && (
            <span
              title={email}
              className="hidden max-w-[22ch] truncate text-xs text-slate-400 sm:inline"
            >
              {email}
            </span>
          )}

          <form action={cerrarSesion}>
            <button
              type="submit"
              className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
