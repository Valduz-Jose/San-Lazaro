import type { Metadata } from "next";

import { GaleriaGrid } from "@/components/GaleriaGrid";
import { AvisoConfiguracion, EmptyState, Section } from "@/components/ui";
import { supabaseConfigurado } from "@/lib/env";
import { obtenerGaleria } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Galería",
  description: "Fotos de rescates, jornadas y adopciones de la fundación.",
};

export default async function GaleriaPage() {
  const fotos = await obtenerGaleria();

  return (
    <Section
      titulo="Galería"
      descripcion="Cada foto es un rescate, una jornada o un final feliz. Haz clic para ampliarla."
    >
      {!supabaseConfigurado && (
        <div className="mb-6">
          <AvisoConfiguracion />
        </div>
      )}

      {fotos.length > 0 ? (
        <GaleriaGrid fotos={fotos} />
      ) : (
        <EmptyState
          titulo="Todavía no hay fotos"
          descripcion="Sube las imágenes al bucket `galeria` de Supabase Storage y registra la ruta en la tabla `galeria`."
        />
      )}
    </Section>
  );
}
