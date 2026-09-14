"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

function BotonConfirmar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
    >
      {pending ? "Eliminando…" : "Sí, eliminar"}
    </button>
  );
}

/**
 * Borrado en dos pasos: el primer clic pide confirmación en línea.
 * Evitamos `window.confirm` para no bloquear la pestaña con un diálogo nativo.
 *
 * `accion` es la server action que recibe el `id` por FormData.
 */
export function BotonEliminar({
  accion,
  id,
  descripcion,
  advertencia,
}: {
  accion: (formData: FormData) => void | Promise<void>;
  id: string;
  descripcion: string;
  advertencia?: string;
}) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-red-700"
      >
        Eliminar
      </button>
    );
  }

  return (
    <form
      action={accion}
      className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-slate-700"
    >
      <input type="hidden" name="id" value={id} />

      <p>¿Eliminar {descripcion}?</p>
      {advertencia && <p className="mt-1 font-medium text-red-700">{advertencia}</p>}

      <div className="mt-2 flex items-center gap-2">
        <BotonConfirmar />
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
