"use client";

import Image from "next/image";
import { useState } from "react";

import { eliminarFoto } from "@/app/admin/galeria/actions";
import { BotonEliminar } from "@/components/BotonEliminar";
import { FotoGaleriaFormulario } from "@/components/FotoGaleriaFormulario";
import { Badge } from "@/components/ui";
import { formatearFecha } from "@/lib/utils";
import type { FotoGaleria } from "@/types";

export function FotoGaleriaAdminCard({ foto }: { foto: FotoGaleria }) {
  const [editando, setEditando] = useState(false);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {foto.imagen_url ? (
            <Image
              src={foto.imagen_url}
              alt={foto.titulo}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-2xl">🖼️</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{foto.titulo}</h3>
            {foto.destacada && (
              <Badge className="bg-amber-100 text-amber-800 ring-amber-600/20">Destacada</Badge>
            )}
            {foto.categoria && <Badge>{foto.categoria}</Badge>}
          </div>

          {foto.descripcion && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{foto.descripcion}</p>
          )}

          <p className="mt-1 text-xs text-slate-500">
            Subida el {formatearFecha(foto.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditando((valor) => !valor)}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            {editando ? "Cerrar" : "Editar"}
          </button>

          <BotonEliminar
            accion={eliminarFoto}
            id={foto.id}
            descripcion={`la foto "${foto.titulo}"`}
            advertencia="Se borrará también la imagen del bucket. Esta acción no se puede deshacer."
          />
        </div>
      </div>

      {editando && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <FotoGaleriaFormulario foto={foto} alTerminar={() => setEditando(false)} />
        </div>
      )}
    </article>
  );
}
