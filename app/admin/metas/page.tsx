import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MetaAdminCard } from "@/components/MetaAdminCard";
import { MetaFormulario } from "@/components/MetaFormulario";
import { supabaseConfigurado } from "@/lib/env";
import { obtenerMetas } from "@/lib/queries";
import { getUsuario } from "@/lib/supabase/server";
import type { EstadoMeta } from "@/types";

export const metadata: Metadata = {
  title: "Gestionar metas",
  description: "Alta, edición y estado de las necesidades del refugio.",
};

/** Orden de presentación: primero lo que está en curso. */
const ORDEN_ESTADO: Record<EstadoMeta, number> = {
  activa: 0,
  cumplida: 1,
  archivada: 2,
};

export default async function AdminMetasPage() {
  if (!supabaseConfigurado) redirect("/login");

  const usuario = await getUsuario();
  if (!usuario) redirect("/login?next=/admin/metas");

  const metas = (await obtenerMetas(false)).sort(
    (a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado],
  );

  const activas = metas.filter((meta) => meta.estado === "activa").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Necesidades del refugio
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {metas.length} meta{metas.length === 1 ? "" : "s"} en total, {activas} activa
        {activas === 1 ? "" : "s"}. Solo las activas aparecen en la web pública y en el
        desplegable de{" "}
        <Link href="/admin/donaciones" className="font-medium text-emerald-700 hover:underline">
          registrar donaciones
        </Link>
        .
      </p>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Nueva meta</h2>
        <MetaFormulario />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Todas las metas</h2>

        {metas.length > 0 ? (
          <div className="space-y-4">
            {metas.map((meta) => (
              <MetaAdminCard key={meta.id} meta={meta} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">
            Todavía no hay metas. Crea la primera con el formulario de arriba.
          </p>
        )}
      </section>
    </div>
  );
}
