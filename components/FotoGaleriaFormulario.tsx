"use client";

import Image from "next/image";
import { useActionState, useRef } from "react";

import { actualizarFoto, crearFoto } from "@/app/admin/galeria/actions";
import type { FotoGaleria, ResultadoFormulario } from "@/types";

const CLASE_CAMPO =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

const CLASE_ARCHIVO =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700";

/**
 * Alta y edición de fotos comparten campos y firma de server action, así que
 * usan el mismo formulario. Si llega `foto`, edita; si no, crea.
 */
export function FotoGaleriaFormulario({
  foto,
  alTerminar,
}: {
  foto?: FotoGaleria;
  alTerminar?: () => void;
}) {
  const esEdicion = Boolean(foto);
  const formulario = useRef<HTMLFormElement>(null);

  const [estado, accion, pendiente] = useActionState<ResultadoFormulario, FormData>(
    async (previo, formData) => {
      const resultado = esEdicion
        ? await actualizarFoto(previo, formData)
        : await crearFoto(previo, formData);

      if (resultado?.ok) {
        // Al crear dejamos el formulario limpio para la siguiente foto.
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
  //
  // Aquí no hace falta `key` en ningún campo: no hay `<select>`, y react-dom
  // sí resincroniza `defaultValue` / `defaultChecked` de inputs y textareas
  // en cada render.
  const enviados = estado && !estado.ok ? estado.valores : undefined;

  const inicial = (campo: string, guardado: string | number | null | undefined) =>
    enviados?.[campo] ?? guardado ?? "";

  // Una casilla sin marcar no viaja en el FormData, así que su ausencia
  // significa "desmarcada", no "usa el valor guardado".
  const destacada = enviados ? enviados.destacada === "on" : (foto?.destacada ?? false);

  return (
    <form
      ref={formulario}
      action={accion}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      {foto && <input type="hidden" name="id" value={foto.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Título *</span>
          <input
            name="titulo"
            required
            minLength={3}
            defaultValue={inicial("titulo", foto?.titulo)}
            placeholder="Jornada de esterilización"
            className={CLASE_CAMPO}
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Categoría</span>
          <input
            name="categoria"
            maxLength={40}
            defaultValue={inicial("categoria", foto?.categoria)}
            placeholder="Jornadas, rescates, voluntariado…"
            className={CLASE_CAMPO}
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Descripción</span>
        <textarea
          name="descripcion"
          rows={2}
          defaultValue={inicial("descripcion", foto?.descripcion)}
          placeholder="Qué se ve en la foto y cuándo se tomó."
          className={CLASE_CAMPO}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="destacada"
          defaultChecked={destacada}
          className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="font-medium text-slate-700">
          Destacada <span className="text-teal-700">(aparece primero en la galería)</span>
        </span>
      </label>

      <div className="text-sm">
        <span className="font-medium text-slate-700">Imagen {esEdicion ? "" : "*"}</span>

        <div className="mt-1 flex items-start gap-3">
          {esEdicion && foto?.imagen_url && (
            <div className="relative size-16 shrink-0 overflow-hidden rounded bg-slate-100">
              <Image
                src={foto.imagen_url}
                alt={`Imagen actual de ${foto.titulo}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <input
              type="file"
              name="imagen"
              accept="image/*"
              required={!esEdicion}
              aria-label="Imagen"
              className={CLASE_ARCHIVO}
            />
            <span className="mt-1 block text-xs text-teal-700">
              {esEdicion
                ? "Déjalo vacío para conservar la imagen actual. Si subes otra, la anterior se borra."
                : "Obligatoria."}{" "}
              Máximo 8 MB. Se sube al bucket <code>galeria</code>.
            </span>

            {/* Los archivos son lo único que no podemos repoblar: el navegador
                no deja fijar el valor de un `<input type="file">`. */}
            {enviados && (
              <span className="mt-1 block text-xs font-medium text-amber-700">
                Vuelve a elegir la imagen: el navegador no conserva archivos entre intentos.
              </span>
            )}
          </div>
        </div>
      </div>

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
          {pendiente ? "Guardando…" : esEdicion ? "Guardar cambios" : "Agregar foto"}
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
