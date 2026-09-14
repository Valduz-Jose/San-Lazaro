"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { FUNDACION, NAVEGACION } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Navegación pública. No expone el panel: `/admin` sigue existiendo, pero se
 * entra escribiendo `/login` a mano, no desde el menú.
 */
export function SiteHeader() {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  const esActiva = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" onClick={() => setAbierto(false)}>
          <span className="grid size-9 place-items-center rounded-full bg-emerald-600 text-lg text-white">
            🐾
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-slate-900">San Lázaro</span>
            <span className="block text-[11px] text-slate-500">{FUNDACION.lema}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAVEGACION.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                esActiva(item.href)
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {item.etiqueta}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setAbierto((valor) => !valor)}
          aria-expanded={abierto}
          aria-label="Abrir menú"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 md:hidden"
        >
          {abierto ? "Cerrar" : "Menú"}
        </button>
      </div>

      {abierto && (
        <nav className="border-t border-slate-200 bg-white px-4 py-2 md:hidden">
          {NAVEGACION.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setAbierto(false)}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium",
                esActiva(item.href)
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {item.etiqueta}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
