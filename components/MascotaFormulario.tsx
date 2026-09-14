"use client";

import Image from "next/image";
import { useActionState, useRef } from "react";

import { actualizarMascota, crearMascota } from "@/app/admin/mascotas/actions";
import {
  ETIQUETAS_ESPECIE,
  ETIQUETAS_SEXO,
  ETIQUETAS_TAMANO,
} from "@/lib/constants";
import type { Mascota, ResultadoFormulario } from "@/types";

const CLASE_CAMPO =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

const CLASE_ARCHIVO =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700";

/**
 * Alta y edición de fichas comparten campos y firma de server action, así que
 * usan el mismo formulario. Si llega `mascota`, edita; si no, crea.
 *
 * El estado de adopción no se toca aquí: se cambia con "Marcar como adoptado"
 * y "Revertir a en adopción", que exigen (o borran) la foto de la familia.
 */
export function MascotaFormulario({
  mascota,
  alTerminar,
}: {
  mascota?: Mascota;
  alTerminar?: () => void;
}) {
  const esEdicion = Boolean(mascota);
  const formulario = useRef<HTMLFormElement>(null);

  const [estado, accion, pendiente] = useActionState<ResultadoFormulario, FormData>(
    async (previo, formData) => {
      const resultado = esEdicion
        ? await actualizarMascota(previo, formData)
        : await crearMascota(previo, formData);

      if (resultado?.ok) {
        // Al crear dejamos el formulario limpio para la siguiente ficha.
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

  // Una casilla sin marcar no viaja en el FormData, así que su ausencia
  // significa "desmarcada", no "usa el valor guardado".
  const marcado = (campo: string, guardado: boolean) =>
    enviados ? enviados[campo] === "on" : guardado;

  // `<select>` no controlado: react-dom solo aplica `defaultValue` al montar,
  // así que hay que remontarlos para que el reset no los devuelva al original.
  const especie = inicial("especie", mascota?.especie ?? "perro");
  const sexo = inicial("sexo", mascota?.sexo ?? "hembra");
  const tamano = inicial("tamano", mascota?.tamano);

  return (
    <form
      ref={formulario}
      action={accion}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      {mascota && <input type="hidden" name="id" value={mascota.id} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Nombre *</span>
          <input
            name="nombre"
            required
            minLength={2}
            defaultValue={inicial("nombre", mascota?.nombre)}
            placeholder="Luna"
            className={CLASE_CAMPO}
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Especie *</span>
          <select
            key={String(especie)}
            name="especie"
            required
            defaultValue={especie}
            className={CLASE_CAMPO}
          >
            {Object.entries(ETIQUETAS_ESPECIE).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Sexo *</span>
          <select
            key={String(sexo)}
            name="sexo"
            required
            defaultValue={sexo}
            className={CLASE_CAMPO}
          >
            {Object.entries(ETIQUETAS_SEXO).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Raza</span>
          <input
            name="raza"
            defaultValue={inicial("raza", mascota?.raza)}
            placeholder="Mestizo"
            className={CLASE_CAMPO}
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Edad (meses)</span>
          <input
            type="number"
            name="edad_meses"
            min="0"
            max="600"
            step="1"
            defaultValue={inicial("edad_meses", mascota?.edad_meses)}
            placeholder="18"
            className={CLASE_CAMPO}
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Tamaño</span>
          <select
            key={String(tamano)}
            name="tamano"
            defaultValue={tamano}
            className={CLASE_CAMPO}
          >
            <option value="">Sin definir</option>
            {Object.entries(ETIQUETAS_TAMANO).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Descripción *</span>
        <textarea
          name="descripcion"
          rows={2}
          required
          minLength={10}
          defaultValue={inicial("descripcion", mascota?.descripcion)}
          placeholder="Cómo es su carácter y con quién convive bien."
          className={CLASE_CAMPO}
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Historia</span>
        <textarea
          name="historia"
          rows={5}
          defaultValue={inicial("historia", mascota?.historia)}
          placeholder="Reseña más larga: cómo llegó al refugio, su rescate y su recuperación."
          className={CLASE_CAMPO}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Fecha de rescate</span>
          <input
            type="date"
            name="fecha_rescate"
            defaultValue={inicial("fecha_rescate", mascota?.fecha_rescate)}
            className={CLASE_CAMPO}
          />
        </label>

        <fieldset className="text-sm">
          <legend className="font-medium text-slate-700">Salud</legend>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="vacunado"
                defaultChecked={marcado("vacunado", mascota?.vacunado ?? false)}
                className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700">Vacunado</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="esterilizado"
                defaultChecked={marcado("esterilizado", mascota?.esterilizado ?? false)}
                className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700">Esterilizado</span>
            </label>
          </div>
        </fieldset>
      </div>

      <div className="text-sm">
        <span className="font-medium text-slate-700">
          Foto principal {esEdicion ? "" : "*"}
        </span>

        <div className="mt-1 flex items-start gap-3">
          {esEdicion && mascota?.imagen_url && (
            <div className="relative size-16 shrink-0 overflow-hidden rounded bg-slate-100">
              <Image
                src={mascota.imagen_url}
                alt={`Foto actual de ${mascota.nombre}`}
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
              aria-label="Foto principal"
              className={CLASE_ARCHIVO}
            />
            <span className="mt-1 block text-xs text-slate-500">
              {esEdicion
                ? "Déjalo vacío para conservar la foto actual. Si subes otra, la anterior se borra."
                : "Obligatoria."}{" "}
              Máximo 8 MB. Se sube al bucket <code>mascotas</code>.
            </span>

            {/* Los archivos son lo único que no podemos repoblar: el navegador
                no deja fijar el valor de un `<input type="file">`. */}
            {enviados && (
              <span className="mt-1 block text-xs font-medium text-amber-700">
                Vuelve a elegir la foto: el navegador no conserva archivos entre intentos.
              </span>
            )}
          </div>
        </div>
      </div>

      {!esEdicion && (
        <p className="text-xs text-slate-500">
          La ficha se crea siempre en estado «En adopción».
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
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendiente ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear ficha"}
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
