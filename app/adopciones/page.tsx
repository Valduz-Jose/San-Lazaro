import type { Metadata } from "next";

import { FiltrosAdopciones } from "@/components/FiltrosAdopciones";
import { MascotaCard } from "@/components/MascotaCard";
import { AvisoConfiguracion, EmptyState, Section } from "@/components/ui";
import { supabaseConfigurado } from "@/lib/env";
import { obtenerMascotas } from "@/lib/queries";
import type { EspecieMascota, EstadoAdopcion, TamanoMascota } from "@/types";

export const metadata: Metadata = {
  title: "Adopciones",
  description: "Mascotas rescatadas que buscan un hogar responsable.",
};

const ESPECIES: EspecieMascota[] = ["perro", "gato", "otro"];
const ESTADOS: EstadoAdopcion[] = ["en_adopcion", "adoptado"];
const TAMANOS: TamanoMascota[] = ["pequeno", "mediano", "grande"];

/** Solo acepta valores del enum; ignora cualquier cosa rara en la URL. */
function validar<T extends string>(valor: string | undefined, permitidos: T[]): T | undefined {
  return permitidos.includes(valor as T) ? (valor as T) : undefined;
}

export default async function AdopcionesPage({ searchParams }: PageProps<"/adopciones">) {
  const params = await searchParams;
  const leer = (clave: string) => {
    const valor = params[clave];
    return Array.isArray(valor) ? valor[0] : valor;
  };

  const mascotas = await obtenerMascotas({
    especie: validar(leer("especie"), ESPECIES),
    estado: validar(leer("estado"), ESTADOS),
    tamano: validar(leer("tamano"), TAMANOS),
  });

  return (
    <Section
      titulo="Mascotas en adopción"
      descripcion="Filtra por especie, tamaño o estado. Si alguno te roba el corazón, escríbenos."
    >
      {!supabaseConfigurado && (
        <div className="mb-6">
          <AvisoConfiguracion />
        </div>
      )}

      <FiltrosAdopciones />

      <div className="mt-6">
        {mascotas.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mascotas.map((mascota) => (
              <MascotaCard key={mascota.id} mascota={mascota} />
            ))}
          </div>
        ) : (
          <EmptyState
            titulo="No encontramos mascotas con esos filtros"
            descripcion="Prueba quitando algún filtro o vuelve pronto: registramos rescatados cada semana."
          />
        )}
      </div>
    </Section>
  );
}
