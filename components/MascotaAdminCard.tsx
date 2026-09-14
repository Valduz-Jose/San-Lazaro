"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import { eliminarMascota, revertirAdopcion } from "@/app/admin/mascotas/actions";
import { BotonEliminar } from "@/components/BotonEliminar";
import { MascotaAdopcionForm } from "@/components/MascotaAdopcionForm";
import { MascotaFormulario } from "@/components/MascotaFormulario";
import { Badge } from "@/components/ui";
import {
  COLOR_ESTADO,
  ETIQUETAS_ESPECIE,
  ETIQUETAS_ESTADO,
  ETIQUETAS_SEXO,
  ETIQUETAS_TAMANO,
} from "@/lib/constants";
import { formatearEdad, formatearFecha } from "@/lib/utils";
import type { Mascota } from "@/types";

function BotonConfirmarReversion() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
    >
      {pending ? "Revirtiendo…" : "Sí, revertir"}
    </button>
  );
}

/**
 * Deshacer una adopción borra la foto con la familia, así que confirmamos
 * en línea igual que en el borrado, sin `window.confirm`.
 */
function BotonRevertir({ mascota }: { mascota: Mascota }) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-amber-700"
      >
        Revertir a en adopción
      </button>
    );
  }

  return (
    <form
      action={revertirAdopcion}
      className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-slate-700"
    >
      <input type="hidden" name="id" value={mascota.id} />

      <p>¿Devolver a {mascota.nombre} al estado «En adopción»?</p>
      <p className="mt-1 font-medium text-amber-800">
        Se borrará la foto con la familia. Tendrás que volver a subirla.
      </p>

      <div className="mt-2 flex items-center gap-2">
        <BotonConfirmarReversion />
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

export function MascotaAdminCard({ mascota }: { mascota: Mascota }) {
  const [panel, setPanel] = useState<"editar" | "adoptar" | null>(null);

  const adoptado = mascota.estado === "adoptado";

  const resumen = [
    ETIQUETAS_ESPECIE[mascota.especie],
    ETIQUETAS_SEXO[mascota.sexo],
    formatearEdad(mascota.edad_meses),
    mascota.raza,
    mascota.tamano && ETIQUETAS_TAMANO[mascota.tamano],
  ].filter(Boolean);

  const salud =
    [mascota.vacunado && "Vacunado", mascota.esterilizado && "Esterilizado"]
      .filter(Boolean)
      .join(" · ") || "Sin vacunar ni esterilizar";

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {mascota.imagen_url ? (
            <Image
              src={mascota.imagen_url}
              alt={mascota.nombre}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-2xl">🐾</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{mascota.nombre}</h3>
            <Badge className={COLOR_ESTADO[mascota.estado]}>
              {ETIQUETAS_ESTADO[mascota.estado]}
            </Badge>
          </div>

          <p className="mt-1 text-sm text-slate-600">{resumen.join(" · ")}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {salud} · Rescate: {formatearFecha(mascota.fecha_rescate)}
          </p>

          {mascota.descripcion && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{mascota.descripcion}</p>
          )}

          <Link
            href={`/adopciones/${mascota.id}`}
            className="mt-2 inline-block text-xs font-medium text-emerald-700 hover:underline"
          >
            Ver ficha pública →
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPanel((actual) => (actual === "editar" ? null : "editar"))}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            {panel === "editar" ? "Cerrar" : "Editar"}
          </button>

          {adoptado ? (
            <BotonRevertir mascota={mascota} />
          ) : (
            <button
              type="button"
              onClick={() => setPanel((actual) => (actual === "adoptar" ? null : "adoptar"))}
              className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              {panel === "adoptar" ? "Cerrar" : "Marcar como adoptado"}
            </button>
          )}

          <BotonEliminar
            accion={eliminarMascota}
            id={mascota.id}
            descripcion={`la ficha de ${mascota.nombre}`}
            advertencia="Se borrarán también sus fotos del bucket. Esta acción no se puede deshacer."
          />
        </div>
      </div>

      {adoptado && mascota.imagen_familia_url && (
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded bg-slate-100">
            <Image
              src={mascota.imagen_familia_url}
              alt={`${mascota.nombre} con su nueva familia`}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
          <p className="text-xs text-slate-600">
            Foto con la nueva familia, publicada en la ficha de {mascota.nombre}.
          </p>
        </div>
      )}

      {panel === "editar" && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <MascotaFormulario mascota={mascota} alTerminar={() => setPanel(null)} />
        </div>
      )}

      {panel === "adoptar" && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <MascotaAdopcionForm mascota={mascota} alTerminar={() => setPanel(null)} />
        </div>
      )}
    </article>
  );
}
