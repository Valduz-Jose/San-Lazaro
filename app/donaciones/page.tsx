import type { Metadata } from "next";

import { MetaCard } from "@/components/MetaCard";
import { AvisoConfiguracion, EmptyState, Section } from "@/components/ui";
import { FUNDACION } from "@/lib/constants";
import { supabaseConfigurado } from "@/lib/env";
import { obtenerMetas } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Donaciones",
  description: "Estas son las necesidades del refugio y cuánto llevamos reunido.",
};

export default async function DonacionesPage() {
  const metas = await obtenerMetas();

  return (
    <Section
      titulo="Lo que necesitamos ahora"
      descripcion="Cada meta es una necesidad concreta del refugio. Aquí puedes ver cuánto llevamos reunido y quiénes han aportado."
    >
      {!supabaseConfigurado && (
        <div className="mb-6">
          <AvisoConfiguracion />
        </div>
      )}

      {metas.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {metas.map((meta) => (
            <MetaCard key={meta.id} meta={meta} />
          ))}
        </div>
      ) : (
        <EmptyState
          titulo="No hay metas activas en este momento"
          descripcion="Cuando el refugio publique una nueva necesidad aparecerá aquí."
        />
      )}

      <div className="mt-10 rounded-xl border border-brand-200 bg-brand-50 p-6">
        <h2 className="text-lg font-semibold text-brand-900">¿Quieres aportar?</h2>
        <p className="mt-1 text-sm text-brand-800">
          Escríbenos a{" "}
          <a href={`mailto:${FUNDACION.email}`} className="font-medium underline">
            {FUNDACION.email}
          </a>{" "}
          o llámanos al {FUNDACION.telefono} y coordinamos la entrega. Registramos cada
          donación con su foto para que puedas ver en qué se convirtió tu aporte.
        </p>
      </div>
    </Section>
  );
}
