import Image from "next/image";

import { ETIQUETAS_TIPO_ALIADO } from "@/lib/constants";
import type { Aliado } from "@/types";
import { Badge } from "@/components/ui";

export function AliadoCard({ aliado }: { aliado: Aliado }) {
  return (
    <article className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {aliado.logo_url ? (
          <Image
            src={aliado.logo_url}
            alt={`Logo de ${aliado.nombre}`}
            fill
            sizes="64px"
            className="object-contain p-1"
          />
        ) : (
          <div className="grid h-full place-items-center text-xl font-bold text-slate-400">
            {aliado.nombre.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-navy">{aliado.nombre}</h3>
          <Badge>{ETIQUETAS_TIPO_ALIADO[aliado.tipo]}</Badge>
        </div>

        {aliado.descripcion && (
          <p className="mt-1 text-sm text-slate-600">{aliado.descripcion}</p>
        )}

        {aliado.sitio_web && (
          <a
            href={aliado.sitio_web}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block break-all text-sm font-medium text-brand-700 hover:underline"
          >
            {aliado.sitio_web.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>
    </article>
  );
}
