import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui";
import { COLOR_ESTADO, ETIQUETAS_ESPECIE, ETIQUETAS_ESTADO } from "@/lib/constants";
import { supabaseConfigurado } from "@/lib/env";
import { obtenerAliados, obtenerMascotas, obtenerResumen } from "@/lib/queries";
import { getUsuario } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Panel",
  description: "Resumen interno de la fundación.",
};

export default async function AdminPage() {
  if (!supabaseConfigurado) redirect("/login");

  const usuario = await getUsuario();
  if (!usuario) redirect("/login?next=/admin");

  const [resumen, mascotas, aliados] = await Promise.all([
    obtenerResumen(),
    obtenerMascotas(),
    obtenerAliados(),
  ]);

  const metricas = [
    { etiqueta: "En adopción", valor: resumen.enAdopcion },
    { etiqueta: "Adoptados", valor: resumen.adoptados },
    { etiqueta: "Aliados", valor: aliados.length },
    { etiqueta: "Metas activas", valor: resumen.metasActivas },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel</h1>
      <p className="mt-1 text-sm text-slate-600">
        Resumen del refugio. Usa las pestañas de arriba para gestionar cada módulo.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metricas.map((metrica) => (
          <div
            key={metrica.etiqueta}
            className="rounded-xl border border-slate-200 bg-white px-4 py-5"
          >
            <dt className="text-xs text-slate-500">{metrica.etiqueta}</dt>
            <dd className="mt-1 text-3xl font-bold text-slate-900">{metrica.valor}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Registro de mascotas</h2>

        {mascotas.length > 0 ? (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Especie</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Salud</th>
                  <th className="px-4 py-3 font-medium">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mascotas.map((mascota) => (
                  <tr key={mascota.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{mascota.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {ETIQUETAS_ESPECIE[mascota.especie]}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={COLOR_ESTADO[mascota.estado]}>
                        {ETIQUETAS_ESTADO[mascota.estado]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {[mascota.vacunado && "Vacunado", mascota.esterilizado && "Esterilizado"]
                        .filter(Boolean)
                        .join(" · ") || "Pendiente"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/adopciones/${mascota.id}`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">
            No hay mascotas registradas todavía.
          </p>
        )}
      </section>
    </div>
  );
}
