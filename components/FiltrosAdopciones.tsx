"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { ETIQUETAS_ESPECIE, ETIQUETAS_ESTADO, ETIQUETAS_TAMANO } from "@/lib/constants";

const GRUPOS = [
  { parametro: "especie", etiqueta: "Especie", opciones: ETIQUETAS_ESPECIE },
  { parametro: "estado", etiqueta: "Estado", opciones: ETIQUETAS_ESTADO },
  { parametro: "tamano", etiqueta: "Tamaño", opciones: ETIQUETAS_TAMANO },
] as const;

/** Filtros del listado de adopciones: escriben en la URL (?especie=perro). */
export function FiltrosAdopciones() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendiente, iniciarTransicion] = useTransition();

  const actualizar = (parametro: string, valor: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (valor) params.set(parametro, valor);
    else params.delete(parametro);

    iniciarTransicion(() => {
      router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
    });
  };

  const hayFiltros = GRUPOS.some(({ parametro }) => searchParams.get(parametro));

  return (
    <div
      className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4"
      data-pendiente={pendiente}
    >
      {GRUPOS.map(({ parametro, etiqueta, opciones }) => (
        <label key={parametro} className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">{etiqueta}</span>
          <select
            value={searchParams.get(parametro) ?? ""}
            onChange={(evento) => actualizar(parametro, evento.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Todos</option>
            {Object.entries(opciones).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </label>
      ))}

      {hayFiltros && (
        <button
          type="button"
          onClick={() => iniciarTransicion(() => router.replace(pathname, { scroll: false }))}
          className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
