import Link from "next/link";

import { GaleriaGrid } from "@/components/GaleriaGrid";
import { MascotaCard } from "@/components/MascotaCard";
import { AvisoConfiguracion, EmptyState, Section } from "@/components/ui";
import { FUNDACION } from "@/lib/constants";
import { supabaseConfigurado } from "@/lib/env";
import { obtenerGaleria, obtenerMascotas, obtenerResumen } from "@/lib/queries";

export default async function Home() {
  const [mascotas, fotos, resumen] = await Promise.all([
    obtenerMascotas({ estado: "en_adopcion" }),
    obtenerGaleria(8),
    obtenerResumen(),
  ]);

  const destacadas = mascotas.slice(0, 6);

  const metricas = [
    { valor: resumen.enAdopcion, etiqueta: "Esperando hogar" },
    { valor: resumen.adoptados, etiqueta: "Ya adoptados" },
    { valor: resumen.aliados, etiqueta: "Aliados activos" },
    { valor: resumen.fotos, etiqueta: "Momentos en la galería" },
  ];

  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            {FUNDACION.nombre}
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {FUNDACION.lema}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            {FUNDACION.descripcion}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/adopciones"
              className="rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Conoce a nuestros rescatados
            </Link>
            <Link
              href="/donaciones"
              className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
            >
              Quiero donar
            </Link>
          </div>

          <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {metricas.map((metrica) => (
              <div
                key={metrica.etiqueta}
                className="rounded-xl border border-slate-200 bg-white px-4 py-5"
              >
                <dt className="sr-only">{metrica.etiqueta}</dt>
                <dd className="text-3xl font-bold text-emerald-700">{metrica.valor}</dd>
                <dd className="mt-1 text-xs text-slate-600">{metrica.etiqueta}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {!supabaseConfigurado && (
        <div className="mx-auto max-w-6xl px-4 pt-8">
          <AvisoConfiguracion />
        </div>
      )}

      <Section
        titulo="Buscan familia"
        descripcion="Cada uno llegó a la fundación con una historia distinta. Hoy solo les falta un hogar."
        accion={
          <Link
            href="/adopciones"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            Ver todos →
          </Link>
        }
      >
        {destacadas.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {destacadas.map((mascota) => (
              <MascotaCard key={mascota.id} mascota={mascota} />
            ))}
          </div>
        ) : (
          <EmptyState
            titulo="Todavía no hay mascotas publicadas"
            descripcion="Cuando registres rescatados en Supabase aparecerán aquí automáticamente."
          />
        )}
      </Section>

      <Section
        titulo="Galería"
        descripcion="Rescates, jornadas de vacunación y finales felices."
        accion={
          <Link href="/galeria" className="text-sm font-medium text-emerald-700 hover:underline">
            Ver galería completa →
          </Link>
        }
      >
        {fotos.length > 0 ? (
          <GaleriaGrid fotos={fotos} />
        ) : (
          <EmptyState
            titulo="La galería está vacía"
            descripcion="Sube fotos al bucket `galeria` de Supabase Storage y regístralas en la tabla `galeria`."
          />
        )}
      </Section>
    </>
  );
}
