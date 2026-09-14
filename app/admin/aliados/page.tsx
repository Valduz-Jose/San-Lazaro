import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AliadoAdminCard } from "@/components/AliadoAdminCard";
import { AliadoFormulario } from "@/components/AliadoFormulario";
import { supabaseConfigurado } from "@/lib/env";
import { obtenerAliados } from "@/lib/queries";
import { getUsuario } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Gestionar aliados",
  description: "Alta, edición y visibilidad de las organizaciones que apoyan al refugio.",
};

export default async function AdminAliadosPage() {
  if (!supabaseConfigurado) redirect("/login");

  const usuario = await getUsuario();
  if (!usuario) redirect("/login?next=/admin/aliados");

  // La consulta ya viene ordenada por nombre y `sort` es estable, así que
  // dentro de cada grupo se conserva el orden alfabético.
  const aliados = (await obtenerAliados(false)).sort(
    (a, b) => Number(b.activo) - Number(a.activo),
  );

  const activos = aliados.filter((aliado) => aliado.activo).length;
  const inactivos = aliados.length - activos;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Aliados de la fundación
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {aliados.length} aliado{aliados.length === 1 ? "" : "s"} en total: {activos} activo
        {activos === 1 ? "" : "s"} y {inactivos} inactivo{inactivos === 1 ? "" : "s"}. Solo los
        activos aparecen en{" "}
        <Link href="/aliados" className="font-medium text-emerald-700 hover:underline">
          la página pública
        </Link>
        .
      </p>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Nuevo aliado</h2>
        <AliadoFormulario />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Todos los aliados</h2>

        {aliados.length > 0 ? (
          <div className="space-y-4">
            {aliados.map((aliado) => (
              <AliadoAdminCard key={aliado.id} aliado={aliado} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">
            Todavía no hay aliados. Crea el primero con el formulario de arriba.
          </p>
        )}
      </section>
    </div>
  );
}
