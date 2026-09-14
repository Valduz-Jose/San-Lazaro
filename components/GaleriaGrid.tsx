"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type { FotoGaleria } from "@/types";

/** Mosaico de fotos con visor a pantalla completa. */
export function GaleriaGrid({ fotos }: { fotos: FotoGaleria[] }) {
  const [activa, setActiva] = useState<FotoGaleria | null>(null);

  useEffect(() => {
    if (!activa) return;

    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setActiva(null);
    };

    document.addEventListener("keydown", alPresionar);
    return () => document.removeEventListener("keydown", alPresionar);
  }, [activa]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {fotos.map((foto) => (
          <li key={foto.id}>
            <button
              type="button"
              onClick={() => setActiva(foto)}
              className="group relative block aspect-square w-full overflow-hidden rounded-lg bg-slate-100"
            >
              <Image
                src={foto.imagen_url}
                alt={foto.titulo}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {foto.titulo}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {activa && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activa.titulo}
          onClick={() => setActiva(null)}
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
        >
          <figure
            onClick={(evento) => evento.stopPropagation()}
            className="max-h-full w-full max-w-3xl overflow-hidden rounded-xl bg-white"
          >
            <div className="relative aspect-[4/3] bg-slate-900">
              <Image
                src={activa.imagen_url}
                alt={activa.titulo}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-contain"
              />
            </div>
            <figcaption className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="font-semibold text-slate-900">{activa.titulo}</p>
                {activa.descripcion && (
                  <p className="mt-1 text-sm text-slate-600">{activa.descripcion}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiva(null)}
                className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
