"use client";

import { useActionState } from "react";

import { iniciarSesion } from "@/app/login/actions";
import type { ResultadoFormulario } from "@/types";

const CLASE_CAMPO =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export function LoginForm({ destino }: { destino: string }) {
  const [estado, accion, pendiente] = useActionState<ResultadoFormulario, FormData>(
    iniciarSesion,
    null,
  );

  return (
    <form action={accion} className="space-y-4">
      <input type="hidden" name="next" value={destino} />

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Correo</span>
        <input type="email" name="email" required autoComplete="email" className={CLASE_CAMPO} />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Contraseña</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className={CLASE_CAMPO}
        />
      </label>

      {estado && !estado.ok && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pendiente}
        className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pendiente ? "Entrando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
