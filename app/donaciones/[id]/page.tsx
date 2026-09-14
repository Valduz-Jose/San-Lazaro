import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProgresoMeta } from "@/components/MetaCard";
import { Badge, EmptyState } from "@/components/ui";
import { ETIQUETAS_CATEGORIA_META } from "@/lib/constants";
import { obtenerDonacionesDeMeta, obtenerMeta } from "@/lib/queries";
import { formatearCantidad, formatearFecha, metaCumplida } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/donaciones/[id]">): Promise<Metadata> {
  const { id } = await params;
  const meta = await obtenerMeta(id);

  if (!meta) return { title: "Meta no encontrada" };

  return {
    title: meta.titulo,
    description: meta.descripcion ?? `Ayúdanos a reunir ${meta.monto_objetivo} ${meta.unidad}.`,
  };
}

export default async function MetaPage({ params }: PageProps<"/donaciones/[id]">) {
  const { id } = await params;
  const meta = await obtenerMeta(id);

  if (!meta) notFound();

  const donaciones = await obtenerDonacionesDeMeta(meta.id);
  const cumplida = metaCumplida(meta.monto_actual, meta.monto_objetivo);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link
        href="/donaciones"
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ← Volver a las metas
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{meta.titulo}</h1>
          {cumplida ? (
            <Badge className="bg-emerald-100 text-emerald-800 ring-emerald-600/20">
              ¡Meta cumplida!
            </Badge>
          ) : (
            meta.categoria && <Badge>{ETIQUETAS_CATEGORIA_META[meta.categoria]}</Badge>
          )}
        </div>

        {meta.descripcion && <p className="mt-3 text-slate-600">{meta.descripcion}</p>}

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <ProgresoMeta meta={meta} />
        </div>
      </header>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">
          Quiénes han donado{" "}
          <span className="text-base font-normal text-slate-500">({donaciones.length})</span>
        </h2>

        {donaciones.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {donaciones.map((donacion) => (
              <li
                key={donacion.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row"
              >
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:aspect-square sm:w-32">
                  {donacion.imagen_url ? (
                    <Image
                      src={donacion.imagen_url}
                      alt={`Donación de ${donacion.es_anonima ? "un donante anónimo" : donacion.donante_nombre}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 128px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-2xl">📦</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    {donacion.es_anonima
                      ? "Donación anónima"
                      : (donacion.donante_nombre ?? "Donación anónima")}
                  </p>
                  <p className="mt-1 text-sm text-emerald-700">
                    Aportó {formatearCantidad(donacion.cantidad)} {meta.unidad}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatearFecha(donacion.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState
              titulo="Todavía nadie ha donado a esta meta"
              descripcion="Sé el primero en aportar. Escríbenos y coordinamos la entrega."
            />
          </div>
        )}
      </section>
    </div>
  );
}
