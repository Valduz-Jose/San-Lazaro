import Image from "next/image";
import Link from "next/link";

import {
  COLOR_ESTADO,
  ETIQUETAS_ESPECIE,
  ETIQUETAS_ESTADO,
  ETIQUETAS_SEXO,
} from "@/lib/constants";
import { formatearEdad } from "@/lib/utils";
import type { Mascota } from "@/types";
import { Badge } from "@/components/ui";

export function MascotaCard({ mascota }: { mascota: Mascota }) {
  return (
    <Link
      href={`/adopciones/${mascota.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-slate-100">
        {mascota.imagen_url ? (
          <Image
            src={mascota.imagen_url}
            alt={mascota.nombre}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl">🐾</div>
        )}
        <div className="absolute left-3 top-3">
          <Badge className={COLOR_ESTADO[mascota.estado]}>
            {ETIQUETAS_ESTADO[mascota.estado]}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-slate-900">{mascota.nombre}</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          {ETIQUETAS_ESPECIE[mascota.especie]} · {ETIQUETAS_SEXO[mascota.sexo]} ·{" "}
          {formatearEdad(mascota.edad_meses)}
        </p>

        {mascota.descripcion && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{mascota.descripcion}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {mascota.vacunado && <Badge>Vacunado</Badge>}
          {mascota.esterilizado && <Badge>Esterilizado</Badge>}
        </div>

        <span className="mt-4 text-sm font-medium text-emerald-700 group-hover:underline">
          Ver ficha →
        </span>
      </div>
    </Link>
  );
}
