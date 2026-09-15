"use client";

import Image from "next/image";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import { cambiarActivoAliado, eliminarAliado } from "@/app/admin/aliados/actions";
import { AliadoFormulario } from "@/components/AliadoFormulario";
import { BotonEliminar } from "@/components/BotonEliminar";
import { Badge } from "@/components/ui";
import { ETIQUETAS_TIPO_ALIADO } from "@/lib/constants";
import type { Aliado } from "@/types";

/**
 * Alterna `activo`. El valor que se envía es el contrario al actual, y va en
 * un `<input type="hidden">` con prop `value`: React sí resincroniza esos en
 * cada render, así que tras revalidar el botón manda el valor correcto.
 */
function BotonActivo({ activo }: { activo: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        activo
          ? "rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-amber-700 disabled:opacity-60"
          : "rounded-md bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      }
    >
      {pending ? "Guardando…" : activo ? "Desactivar" : "Activar"}
    </button>
  );
}

export function AliadoAdminCard({ aliado }: { aliado: Aliado }) {
  const [editando, setEditando] = useState(false);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {aliado.logo_url ? (
            <Image
              src={aliado.logo_url}
              alt={`Logo de ${aliado.nombre}`}
              fill
              sizes="64px"
              className="object-contain p-1"
            />
          ) : (
            <div className="grid h-full place-items-center text-xl font-bold text-slate-400">
              {aliado.nombre.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-navy">{aliado.nombre}</h3>
            <Badge>{ETIQUETAS_TIPO_ALIADO[aliado.tipo]}</Badge>
            <Badge
              className={
                aliado.activo
                  ? "bg-brand-100 text-brand-800 ring-brand-600/20"
                  : "bg-slate-200 text-slate-700 ring-slate-500/20"
              }
            >
              {aliado.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          {aliado.descripcion && (
            <p className="mt-1 text-sm text-slate-600">{aliado.descripcion}</p>
          )}

          {aliado.sitio_web ? (
            <a
              href={aliado.sitio_web}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block break-all text-xs font-medium text-brand-700 hover:underline"
            >
              {aliado.sitio_web.replace(/^https?:\/\//, "")}
            </a>
          ) : (
            <p className="mt-1 text-xs text-slate-400">Sin sitio web</p>
          )}

          {!aliado.activo && (
            <p className="mt-2 text-xs text-amber-700">
              Oculto en <code>/aliados</code> hasta que vuelvas a activarlo.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form action={cambiarActivoAliado}>
            <input type="hidden" name="id" value={aliado.id} />
            <input type="hidden" name="activo" value={aliado.activo ? "false" : "true"} />
            <BotonActivo activo={aliado.activo} />
          </form>

          <button
            type="button"
            onClick={() => setEditando((valor) => !valor)}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            {editando ? "Cerrar" : "Editar"}
          </button>

          <BotonEliminar
            accion={eliminarAliado}
            id={aliado.id}
            descripcion={`a ${aliado.nombre} de los aliados`}
            advertencia="Se borrará también su logo del bucket. Si solo quieres ocultarlo, usa «Desactivar»."
          />
        </div>
      </div>

      {editando && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <AliadoFormulario aliado={aliado} alTerminar={() => setEditando(false)} />
        </div>
      )}
    </article>
  );
}
