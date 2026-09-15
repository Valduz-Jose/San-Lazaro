import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui";
import {
  COLOR_ESTADO,
  ETIQUETAS_ESPECIE,
  ETIQUETAS_ESTADO,
  ETIQUETAS_SEXO,
  ETIQUETAS_TAMANO,
  FUNDACION,
} from "@/lib/constants";
import { obtenerMascota } from "@/lib/queries";
import { formatearEdad, formatearFecha } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/adopciones/[id]">): Promise<Metadata> {
  const { id } = await params;
  const mascota = await obtenerMascota(id);

  if (!mascota) return { title: "Mascota no encontrada" };

  return {
    title: mascota.nombre,
    description: mascota.descripcion ?? `Conoce a ${mascota.nombre}, rescatado por la fundación.`,
  };
}

export default async function MascotaPage({ params }: PageProps<"/adopciones/[id]">) {
  const { id } = await params;
  const mascota = await obtenerMascota(id);

  if (!mascota) notFound();

  const fichaTecnica = [
    { etiqueta: "Especie", valor: ETIQUETAS_ESPECIE[mascota.especie] },
    { etiqueta: "Sexo", valor: ETIQUETAS_SEXO[mascota.sexo] },
    { etiqueta: "Edad", valor: formatearEdad(mascota.edad_meses) },
    { etiqueta: "Tamaño", valor: mascota.tamano ? ETIQUETAS_TAMANO[mascota.tamano] : "—" },
    { etiqueta: "Raza", valor: mascota.raza ?? "Mestizo" },
    { etiqueta: "Rescatado el", valor: formatearFecha(mascota.fecha_rescate) },
    { etiqueta: "Vacunado", valor: mascota.vacunado ? "Sí" : "Pendiente" },
    { etiqueta: "Esterilizado", valor: mascota.esterilizado ? "Sí" : "Pendiente" },
  ];

  return (
    <article className="mx-auto max-w-5xl px-4 py-12">
      <Link
        href="/adopciones"
        className="text-sm font-medium text-teal-700 hover:text-slate-900"
      >
        ← Volver a adopciones
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
          {mascota.imagen_url ? (
            <Image
              src={mascota.imagen_url}
              alt={mascota.nombre}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-6xl">🐾</div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">
              {mascota.nombre}
            </h1>
            <Badge className={COLOR_ESTADO[mascota.estado]}>
              {ETIQUETAS_ESTADO[mascota.estado]}
            </Badge>
          </div>

          {mascota.descripcion && (
            <p className="mt-4 text-slate-600">{mascota.descripcion}</p>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm">
            {fichaTecnica.map((dato) => (
              <div key={dato.etiqueta}>
                <dt className="text-teal-700">{dato.etiqueta}</dt>
                <dd className="font-medium text-slate-900">{dato.valor}</dd>
              </div>
            ))}
          </dl>

          {mascota.estado === "en_adopcion" ? (
            <a
              href={`mailto:${FUNDACION.email}?subject=${encodeURIComponent(`Quiero adoptar a ${mascota.nombre}`)}`}
              className="mt-6 inline-block rounded-md bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Quiero adoptar a {mascota.nombre}
            </a>
          ) : (
            <p className="mt-6 rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-600">
              {mascota.nombre} ya encontró su familia. ¡Gracias por interesarte!
            </p>
          )}
        </div>
      </div>

      {mascota.estado === "adoptado" && mascota.imagen_familia_url && (
        <section className="mt-12 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-bold text-navy">En su nuevo hogar</h2>
          <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-xl bg-slate-100">
            <Image
              src={mascota.imagen_familia_url}
              alt={`${mascota.nombre} con su nueva familia`}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
        </section>
      )}

      {mascota.historia && (
        <section className="mt-12 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-bold text-navy">Su historia</h2>
          <p className="mt-3 whitespace-pre-line text-slate-600">{mascota.historia}</p>
        </section>
      )}
    </article>
  );
}
