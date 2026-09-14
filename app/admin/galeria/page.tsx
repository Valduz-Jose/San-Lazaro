import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FotoGaleriaAdminCard } from "@/components/FotoGaleriaAdminCard";
import { FotoGaleriaFormulario } from "@/components/FotoGaleriaFormulario";
import { supabaseConfigurado } from "@/lib/env";
import { obtenerGaleria } from "@/lib/queries";
import { getUsuario } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Gestionar galería",
  description: "Alta, edición y borrado de las fotos publicadas por la fundación.",
};

export default async function AdminGaleriaPage() {
  if (!supabaseConfigurado) redirect("/login");

  const usuario = await getUsuario();
  if (!usuario) redirect("/login?next=/admin/galeria");

  // `obtenerGaleria()` sin límite ya ordena destacadas primero y, dentro de
  // cada grupo, de la más reciente a la más antigua.
  const fotos = await obtenerGaleria();
  const destacadas = fotos.filter((foto) => foto.destacada).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Galería de la fundación
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {fotos.length} foto{fotos.length === 1 ? "" : "s"} en total, {destacadas} destacada
        {destacadas === 1 ? "" : "s"}. Las destacadas encabezan{" "}
        <Link href="/galeria" className="font-medium text-emerald-700 hover:underline">
          la galería pública
        </Link>
        .
      </p>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Nueva foto</h2>
        <FotoGaleriaFormulario />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Todas las fotos</h2>

        {fotos.length > 0 ? (
          <div className="space-y-4">
            {fotos.map((foto) => (
              <FotoGaleriaAdminCard key={foto.id} foto={foto} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">
            Todavía no hay fotos. Sube la primera con el formulario de arriba.
          </p>
        )}
      </section>
    </div>
  );
}
