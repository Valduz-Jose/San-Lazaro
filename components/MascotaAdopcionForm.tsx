"use client";

import { useActionState } from "react";

import { marcarAdoptado } from "@/app/admin/mascotas/actions";
import type { Mascota, ResultadoFormulario } from "@/types";

/**
 * Cierre de adopción. La foto con la nueva familia es obligatoria: es lo que
 * se publica en la ficha, así que sin ella no dejamos cambiar el estado.
 */
export function MascotaAdopcionForm({
  mascota,
  alTerminar,
}: {
  mascota: Mascota;
  alTerminar: () => void;
}) {
  const [estado, accion, pendiente] = useActionState<ResultadoFormulario, FormData>(
    async (previo, formData) => {
      const resultado = await marcarAdoptado(previo, formData);

      if (resultado?.ok) alTerminar();

      return resultado;
    },
    null,
  );

  return (
    <form action={accion} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <input type="hidden" name="id" value={mascota.id} />

      <p className="text-sm font-semibold text-emerald-900">
        Marcar a {mascota.nombre} como adoptado
      </p>
      <p className="mt-1 text-xs text-emerald-800">
        Sube la foto con la nueva familia. Se guarda en{" "}
        <code>mascotas/familias</code> y aparece en la ficha pública.
      </p>

      <label className="mt-3 block text-sm">
        <span className="font-medium text-slate-700">Foto con la nueva familia *</span>
        <input
          type="file"
          name="imagen_familia"
          accept="image/*"
          required
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
        />
        <span className="mt-1 block text-xs text-slate-500">Obligatoria. Máximo 8 MB.</span>
      </label>

      {estado && (
        <p
          role="status"
          className={
            estado.ok
              ? "mt-3 rounded-md bg-white px-3 py-2 text-sm text-emerald-800"
              : "mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {estado.ok ? estado.mensaje : estado.error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pendiente}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendiente ? "Guardando…" : "Confirmar adopción"}
        </button>

        <button
          type="button"
          onClick={alTerminar}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
