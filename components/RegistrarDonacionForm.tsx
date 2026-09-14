"use client";

import { useActionState, useRef, useState } from "react";

import { registrarDonacion } from "@/app/admin/donaciones/actions";
import { formatearCantidad } from "@/lib/utils";
import type { Meta, ResultadoFormulario } from "@/types";

const CLASE_CAMPO =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

export function RegistrarDonacionForm({ metas }: { metas: Meta[] }) {
  const [esAnonima, setEsAnonima] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);

  const [estado, accion, pendiente] = useActionState<ResultadoFormulario, FormData>(
    async (previo, formData) => {
      const resultado = await registrarDonacion(previo, formData);

      // Tras un registro exitoso dejamos el formulario listo para el siguiente.
      if (resultado?.ok) {
        formulario.current?.reset();
        setEsAnonima(false);
      }

      return resultado;
    },
    null,
  );

  if (metas.length === 0) {
    return (
      <p className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        No hay metas activas. Crea una en el Table Editor de Supabase (tabla{" "}
        <code className="rounded bg-amber-100 px-1">metas</code>) para poder registrar
        donaciones.
      </p>
    );
  }

  return (
    <form
      ref={formulario}
      action={accion}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
    >
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Meta que recibe la donación *</span>
        <select name="meta_id" required defaultValue="" className={CLASE_CAMPO}>
          <option value="" disabled>
            Selecciona una meta…
          </option>
          {metas.map((meta) => (
            <option key={meta.id} value={meta.id}>
              {meta.titulo} ({formatearCantidad(meta.monto_actual)}/
              {formatearCantidad(meta.monto_objetivo)} {meta.unidad})
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">
          Nombre del donante {esAnonima ? "(no aplica)" : "*"}
        </span>
        <input
          name="donante_nombre"
          disabled={esAnonima}
          required={!esAnonima}
          placeholder={esAnonima ? "Donación anónima" : "Nombre y apellido o empresa"}
          className={CLASE_CAMPO}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="es_anonima"
          checked={esAnonima}
          onChange={(evento) => {
            const marcado = evento.target.checked;
            setEsAnonima(marcado);

            // Vaciamos el nombre para no enviar datos de un donante anónimo.
            if (marcado && formulario.current) {
              const campo = formulario.current.elements.namedItem("donante_nombre");
              if (campo instanceof HTMLInputElement) campo.value = "";
            }
          }}
          className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span className="font-medium text-slate-700">Donación anónima</span>
      </label>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Cantidad *</span>
        <input
          type="number"
          name="cantidad"
          min="0.01"
          step="0.01"
          required
          placeholder="En la unidad de la meta (kg, unidades…)"
          className={CLASE_CAMPO}
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Foto de la donación *</span>
        <input
          type="file"
          name="imagen"
          accept="image/*"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
        />
        <span className="mt-1 block text-xs text-slate-500">
          Obligatoria. Máximo 8 MB. Se sube al bucket <code>donaciones</code>.
        </span>
      </label>

      {estado && (
        <p
          role="status"
          className={
            estado.ok
              ? "rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              : "rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {estado.ok ? estado.mensaje : estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pendiente}
        className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pendiente ? "Registrando…" : "Registrar donación"}
      </button>
    </form>
  );
}
