import Link from "next/link";

import { ETIQUETAS_CATEGORIA_META } from "@/lib/constants";
import { formatearCantidad, metaCumplida, porcentajeMeta } from "@/lib/utils";
import type { Meta } from "@/types";
import { Badge } from "@/components/ui";

/** Barra de progreso de una meta. Reutilizable en el listado y en el detalle. */
export function ProgresoMeta({ meta }: { meta: Meta }) {
  const porcentaje = porcentajeMeta(meta.monto_actual, meta.monto_objetivo);
  const cumplida = metaCumplida(meta.monto_actual, meta.monto_objetivo);

  return (
    <div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Avance de ${meta.titulo}`}
      >
        <div
          className={`h-full rounded-full transition-all ${
            cumplida ? "bg-emerald-600" : "bg-emerald-500"
          }`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <p className="mt-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold text-slate-900">
          {formatearCantidad(meta.monto_actual)}/{formatearCantidad(meta.monto_objetivo)}{" "}
          {meta.unidad}
        </span>
        <span className="text-slate-500">{porcentaje}%</span>
      </p>
    </div>
  );
}

export function MetaCard({ meta }: { meta: Meta }) {
  const cumplida = metaCumplida(meta.monto_actual, meta.monto_objetivo);

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{meta.titulo}</h3>
        {cumplida ? (
          <Badge className="bg-emerald-100 text-emerald-800 ring-emerald-600/20">
            ¡Meta cumplida!
          </Badge>
        ) : (
          meta.categoria && <Badge>{ETIQUETAS_CATEGORIA_META[meta.categoria]}</Badge>
        )}
      </div>

      {meta.descripcion && (
        <p className="mt-2 flex-1 text-sm text-slate-600">{meta.descripcion}</p>
      )}

      <div className="mt-4">
        <ProgresoMeta meta={meta} />
      </div>

      <Link
        href={`/donaciones/${meta.id}`}
        className="mt-4 text-sm font-medium text-emerald-700 hover:underline"
      >
        Ver quiénes han donado →
      </Link>
    </article>
  );
}
