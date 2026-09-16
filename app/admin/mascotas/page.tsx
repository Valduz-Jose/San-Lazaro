import type { Metadata } from "next";
import { FileSpreadsheet, QrCode } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MascotaAdminCard } from "@/components/MascotaAdminCard";
import { MascotaFormulario } from "@/components/MascotaFormulario";
import { supabaseConfigurado } from "@/lib/env";
import { obtenerMascotas } from "@/lib/queries";
import { getUsuario } from "@/lib/supabase/server";
import type { EstadoAdopcion } from "@/types";

export const metadata: Metadata = {
  title: "Gestionar mascotas",
  description: "Alta, edición y adopciones de las mascotas del refugio.",
};

/** Orden de presentación: primero lo que sigue buscando hogar. */
const ORDEN_ESTADO: Record<EstadoAdopcion, number> = {
  en_adopcion: 0,
  adoptado: 1,
};

export default async function AdminMascotasPage() {
  if (!supabaseConfigurado) redirect("/login");

  const usuario = await getUsuario();
  if (!usuario) redirect("/login?next=/admin/mascotas");

  const mascotas = (await obtenerMascotas()).sort(
    (a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado],
  );

  const enAdopcion = mascotas.filter((mascota) => mascota.estado === "en_adopcion").length;
  const adoptados = mascotas.length - enAdopcion;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-navy">
        Mascotas del refugio
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {mascotas.length} ficha{mascotas.length === 1 ? "" : "s"} en total: {enAdopcion} en
        adopción y {adoptados} adoptada{adoptados === 1 ? "" : "s"}. Todas aparecen en{" "}
        <Link href="/adopciones" className="font-medium text-brand-700 hover:underline">
          adopciones
        </Link>
        .
      </p>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-navy">Nueva mascota</h2>
        <MascotaFormulario />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-navy">Exportar</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/admin/mascotas/exportar-qr"
            download
            className="inline-flex items-center gap-2 rounded-md border border-brand-600 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
          >
            <QrCode className="size-4" aria-hidden />
            Descargar todos los QR (.zip)
          </a>
          <a
            href="/admin/mascotas/exportar-excel"
            download
            className="inline-flex items-center gap-2 rounded-md border border-brand-600 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
          >
            <FileSpreadsheet className="size-4" aria-hidden />
            Descargar datos en Excel (.xlsx)
          </a>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-navy">Todas las mascotas</h2>

        {mascotas.length > 0 ? (
          <div className="space-y-4">
            {mascotas.map((mascota) => (
              <MascotaAdminCard key={mascota.id} mascota={mascota} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">
            Todavía no hay mascotas. Crea la primera con el formulario de arriba.
          </p>
        )}
      </section>
    </div>
  );
}
