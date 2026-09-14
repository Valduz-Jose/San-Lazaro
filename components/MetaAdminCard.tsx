"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { cambiarEstadoMeta, eliminarMeta } from "@/app/admin/metas/actions";
import { BotonEliminar } from "@/components/BotonEliminar";
import { MetaFormulario } from "@/components/MetaFormulario";
import { ProgresoMeta } from "@/components/MetaCard";
import { Badge } from "@/components/ui";
import { ETIQUETAS_CATEGORIA_META, ETIQUETAS_ESTADO_META } from "@/lib/constants";
import { metaCumplida } from "@/lib/utils";
import type { EstadoMeta, Meta } from "@/types";

const COLOR_ESTADO_META: Record<EstadoMeta, string> = {
  activa: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  cumplida: "bg-sky-100 text-sky-800 ring-sky-600/20",
  archivada: "bg-slate-200 text-slate-700 ring-slate-500/20",
};

/**
 * El `<select>` se autoenvía al cambiar y se bloquea mientras guarda.
 *
 * Va sin `value` (no controlado), así que quien lo monte debe pasarle
 * `key={estado}`: ver la nota en `MetaAdminCard`.
 */
function SelectEstado({ estado }: { estado: EstadoMeta }) {
  const { pending } = useFormStatus();

  return (
    <select
      name="estado"
      defaultValue={estado}
      disabled={pending}
      onChange={(evento) => evento.currentTarget.form?.requestSubmit()}
      aria-label="Estado de la meta"
      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
    >
      {Object.entries(ETIQUETAS_ESTADO_META).map(([valor, texto]) => (
        <option key={valor} value={valor}>
          {texto}
        </option>
      ))}
    </select>
  );
}

export function MetaAdminCard({ meta }: { meta: Meta }) {
  const [editando, setEditando] = useState(false);
  const cumplida = metaCumplida(meta.monto_actual, meta.monto_objetivo);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{meta.titulo}</h3>
            <Badge className={COLOR_ESTADO_META[meta.estado]}>
              {ETIQUETAS_ESTADO_META[meta.estado]}
            </Badge>
            {meta.categoria && <Badge>{ETIQUETAS_CATEGORIA_META[meta.categoria]}</Badge>}
            {cumplida && meta.estado !== "cumplida" && (
              <Badge className="bg-emerald-100 text-emerald-800 ring-emerald-600/20">
                Objetivo alcanzado
              </Badge>
            )}
          </div>

          {meta.descripcion && (
            <p className="mt-1 text-sm text-slate-600">{meta.descripcion}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form action={cambiarEstadoMeta}>
            <input type="hidden" name="id" value={meta.id} />
            {/*
              React resetea el formulario al terminar la server action, y un
              `<select>` no controlado vuelve al `defaultValue` que tenía al
              montarse: react-dom solo aplica `defaultValue` en el montaje, no
              en los renders siguientes. Sin `key` el desplegable se quedaría
              mostrando el estado viejo aunque la meta ya se guardó. Cambiar la
              key lo remonta con el estado real que devolvió `revalidatePath`.
            */}
            <SelectEstado key={meta.estado} estado={meta.estado} />
          </form>

          <button
            type="button"
            onClick={() => setEditando((valor) => !valor)}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            {editando ? "Cerrar" : "Editar"}
          </button>

          <BotonEliminar
            accion={eliminarMeta}
            id={meta.id}
            descripcion={`la meta "${meta.titulo}"`}
            advertencia="Se borrarán también todas sus donaciones registradas (ON DELETE CASCADE). Esta acción no se puede deshacer."
          />
        </div>
      </div>

      <div className="mt-4">
        <ProgresoMeta meta={meta} />
      </div>

      {editando && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <MetaFormulario meta={meta} alTerminar={() => setEditando(false)} />
        </div>
      )}
    </article>
  );
}
