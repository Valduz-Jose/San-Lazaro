import type { Metadata } from "next";

import { AliadoCard } from "@/components/AliadoCard";
import { AvisoConfiguracion, EmptyState, Section } from "@/components/ui";
import { FUNDACION } from "@/lib/constants";
import { supabaseConfigurado } from "@/lib/env";
import { obtenerAliados } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Aliados",
  description: "Veterinarias, empresas y personas que hacen posible nuestro trabajo.",
};

export default async function AliadosPage() {
  const aliados = await obtenerAliados();

  return (
    <Section
      titulo="Nuestros aliados"
      descripcion="Veterinarias, empresas, refugios y personas que sostienen cada rescate."
    >
      {!supabaseConfigurado && (
        <div className="mb-6">
          <AvisoConfiguracion />
        </div>
      )}

      {aliados.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {aliados.map((aliado) => (
            <AliadoCard key={aliado.id} aliado={aliado} />
          ))}
        </div>
      ) : (
        <EmptyState
          titulo="Aún no hay aliados registrados"
          descripcion="Agrega registros en la tabla `aliados` de Supabase para que aparezcan aquí."
        />
      )}

      <div className="mt-10 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-lg font-semibold text-emerald-900">¿Quieres ser aliado?</h2>
        <p className="mt-1 text-sm text-emerald-800">
          Buscamos veterinarias, hogares de paso y empresas que quieran sumarse. Escríbenos a{" "}
          <a href={`mailto:${FUNDACION.email}`} className="font-medium underline">
            {FUNDACION.email}
          </a>
          .
        </p>
      </div>
    </Section>
  );
}
