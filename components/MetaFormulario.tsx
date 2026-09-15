"use client";

import { useActionState, useRef } from "react";

import { actualizarMeta, crearMeta } from "@/app/admin/metas/actions";
import { ETIQUETAS_CATEGORIA_META } from "@/lib/constants";
import type { Meta, ResultadoFormulario } from "@/types";

const CLASE_CAMPO =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

/**
 * Alta y edición de metas comparten campos y firma de server action, así que
 * usan el mismo formulario. Si llega `meta`, edita; si no, crea.
 */
export function MetaFormulario({
  meta,
  alTerminar,
}: {
  meta?: Meta;
  alTerminar?: () => void;
}) {
  const esEdicion = Boolean(meta);
  const formulario = useRef<HTMLFormElement>(null);

  const [estado, accion, pendiente] = useActionState<ResultadoFormulario, FormData>(
    async (previo, formData) => {
      const resultado = esEdicion
        ? await actualizarMeta(previo, formData)
        : await crearMeta(previo, formData);

      if (resultado?.ok) {
        // Al crear dejamos el formulario limpio para la siguiente meta.
        if (!esEdicion) formulario.current?.reset();
        alTerminar?.();
      }

      return resultado;
    },
    null,
  );

  // React resetea el formulario en cuanto termina la action, también cuando
  // devuelve error. Para no borrar lo que el usuario llevaba escrito, tras un
  // fallo los valores por defecto pasan a ser los que acaba de enviar.
  const enviados = estado && !estado.ok ? estado.valores : undefined;

  const inicial = (campo: string, guardado: string | number | null | undefined) =>
    enviados?.[campo] ?? guardado ?? "";

  // `<select>` no controlado: react-dom solo aplica `defaultValue` al montar,
  // así que hay que remontarlo para que el reset no lo devuelva al original.
  const categoria = inicial("categoria", meta?.categoria);

  return (
    <form
      ref={formulario}
      action={accion}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      {meta && <input type="hidden" name="id" value={meta.id} />}

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Título *</span>
        <input
          name="titulo"
          required
          minLength={3}
          defaultValue={inicial("titulo", meta?.titulo)}
          placeholder="Alimento para el mes"
          className={CLASE_CAMPO}
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Descripción</span>
        <textarea
          name="descripcion"
          rows={2}
          defaultValue={inicial("descripcion", meta?.descripcion)}
          placeholder="Para qué se necesita y a cuántos animales beneficia."
          className={CLASE_CAMPO}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Categoría</span>
          <select
            key={String(categoria)}
            name="categoria"
            defaultValue={categoria}
            className={CLASE_CAMPO}
          >
            <option value="">Sin categoría</option>
            {Object.entries(ETIQUETAS_CATEGORIA_META).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Unidad *</span>
          <input
            name="unidad"
            required
            maxLength={20}
            defaultValue={inicial("unidad", meta?.unidad)}
            placeholder="kg, unidades, sacos…"
            className={CLASE_CAMPO}
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Objetivo *</span>
          <input
            type="number"
            name="monto_objetivo"
            min="0.01"
            step="0.01"
            required
            defaultValue={inicial("monto_objetivo", meta?.monto_objetivo)}
            placeholder="300"
            className={CLASE_CAMPO}
          />
        </label>
      </div>

      {!esEdicion && (
        <p className="text-xs text-teal-700">
          Lo reunido arranca en 0 y solo lo mueven las donaciones registradas.
        </p>
      )}

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

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pendiente}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendiente ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear meta"}
        </button>

        {esEdicion && alTerminar && (
          <button
            type="button"
            onClick={alTerminar}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
