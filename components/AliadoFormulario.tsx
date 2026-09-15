"use client";

import Image from "next/image";
import { useActionState, useRef } from "react";

import { actualizarAliado, crearAliado } from "@/app/admin/aliados/actions";
import { ETIQUETAS_TIPO_ALIADO } from "@/lib/constants";
import type { Aliado, ResultadoFormulario } from "@/types";

const CLASE_CAMPO =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

const CLASE_ARCHIVO =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700";

/**
 * Alta y edición de aliados comparten campos y firma de server action, así que
 * usan el mismo formulario. Si llega `aliado`, edita; si no, crea.
 *
 * `activo` no se toca aquí: se cambia con el botón de activar/desactivar.
 */
export function AliadoFormulario({
  aliado,
  alTerminar,
}: {
  aliado?: Aliado;
  alTerminar?: () => void;
}) {
  const esEdicion = Boolean(aliado);
  const formulario = useRef<HTMLFormElement>(null);

  const [estado, accion, pendiente] = useActionState<ResultadoFormulario, FormData>(
    async (previo, formData) => {
      const resultado = esEdicion
        ? await actualizarAliado(previo, formData)
        : await crearAliado(previo, formData);

      if (resultado?.ok) {
        // Al crear dejamos el formulario limpio para el siguiente aliado.
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
  const tipo = inicial("tipo", aliado?.tipo ?? "veterinaria");

  return (
    <form
      ref={formulario}
      action={accion}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      {aliado && <input type="hidden" name="id" value={aliado.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Nombre *</span>
          <input
            name="nombre"
            required
            minLength={2}
            defaultValue={inicial("nombre", aliado?.nombre)}
            placeholder="Clínica San José"
            className={CLASE_CAMPO}
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Tipo *</span>
          <select
            key={String(tipo)}
            name="tipo"
            required
            defaultValue={tipo}
            className={CLASE_CAMPO}
          >
            {Object.entries(ETIQUETAS_TIPO_ALIADO).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Descripción</span>
        <textarea
          name="descripcion"
          rows={2}
          defaultValue={inicial("descripcion", aliado?.descripcion)}
          placeholder="En qué nos apoya: consultas, alimento, hogar de paso…"
          className={CLASE_CAMPO}
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Sitio web</span>
        <input
          name="sitio_web"
          type="text"
          inputMode="url"
          defaultValue={inicial("sitio_web", aliado?.sitio_web)}
          placeholder="clinicasanjose.com"
          className={CLASE_CAMPO}
        />
        <span className="mt-1 block text-xs text-teal-700">
          Opcional. Si no pones <code>https://</code> lo agregamos nosotros.
        </span>
      </label>

      <div className="text-sm">
        <span className="font-medium text-slate-700">Logo {esEdicion ? "" : "*"}</span>

        <div className="mt-1 flex items-start gap-3">
          {esEdicion && aliado?.logo_url && (
            <div className="relative size-16 shrink-0 overflow-hidden rounded bg-slate-100">
              <Image
                src={aliado.logo_url}
                alt={`Logo actual de ${aliado.nombre}`}
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <input
              type="file"
              name="logo"
              accept="image/*"
              required={!esEdicion}
              aria-label="Logo"
              className={CLASE_ARCHIVO}
            />
            <span className="mt-1 block text-xs text-teal-700">
              {esEdicion
                ? "Déjalo vacío para conservar el logo actual. Si subes otro, el anterior se borra."
                : "Obligatorio."}{" "}
              Máximo 8 MB. Se sube al bucket <code>aliados</code>.
            </span>

            {/* Los archivos son lo único que no podemos repoblar: el navegador
                no deja fijar el valor de un `<input type="file">`. */}
            {enviados && (
              <span className="mt-1 block text-xs font-medium text-amber-700">
                Vuelve a elegir el logo: el navegador no conserva archivos entre intentos.
              </span>
            )}
          </div>
        </div>
      </div>

      {!esEdicion && (
        <p className="text-xs text-teal-700">
          El aliado se crea activo, así que aparecerá en <code>/aliados</code> enseguida.
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
          {pendiente ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear aliado"}
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
