import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { eliminarDonacion } from "@/app/admin/donaciones/actions";
import { BotonEliminar } from "@/components/BotonEliminar";
import { RegistrarDonacionForm } from "@/components/RegistrarDonacionForm";
import { supabaseConfigurado } from "@/lib/env";
import { obtenerDonacionesRecientes, obtenerMetas } from "@/lib/queries";
import { getUsuario } from "@/lib/supabase/server";
import { formatearCantidad, formatearFecha } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Registrar donaciones",
  description: "Carga de donaciones en especie recibidas por la fundación.",
};

export default async function AdminDonacionesPage() {
  if (!supabaseConfigurado) redirect("/login");

  const usuario = await getUsuario();
  if (!usuario) redirect("/login?next=/admin/donaciones");

  const [metas, donaciones] = await Promise.all([
    obtenerMetas(),
    obtenerDonacionesRecientes(20),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Registrar donaciones
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Cada donación suma a su meta automáticamente. La foto es obligatoria y queda visible
        en el historial público.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Nueva donación</h2>
          <RegistrarDonacionForm metas={metas} />
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Últimas donaciones registradas
          </h2>

          {donaciones.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Foto</th>
                    <th className="px-4 py-3 font-medium">Donante</th>
                    <th className="px-4 py-3 font-medium">Meta</th>
                    <th className="px-4 py-3 font-medium">Cantidad</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donaciones.map((donacion) => {
                    const donante = donacion.es_anonima
                      ? "Donación anónima"
                      : (donacion.donante_nombre ?? "Donación anónima");

                    return (
                      <tr key={donacion.id}>
                        <td className="px-4 py-3">
                          <div className="relative size-12 overflow-hidden rounded bg-slate-100">
                            {donacion.imagen_url && (
                              <Image
                                src={donacion.imagen_url}
                                alt={`Donación de ${donante}`}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{donante}</td>
                        <td className="px-4 py-3 text-slate-600">{donacion.meta.titulo}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatearCantidad(donacion.cantidad)} {donacion.meta.unidad}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatearFecha(donacion.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <BotonEliminar
                            accion={eliminarDonacion}
                            id={donacion.id}
                            descripcion={`el aporte de ${donante}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">
              Todavía no hay donaciones registradas.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
