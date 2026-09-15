import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/LoginForm";
import { AvisoConfiguracion } from "@/components/ui";
import { supabaseConfigurado } from "@/lib/env";
import { getUsuario } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ingresar",
  description: "Acceso al panel de administración de la fundación.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const siguiente = params.next;
  const destino = (Array.isArray(siguiente) ? siguiente[0] : siguiente) ?? "/admin";

  if (supabaseConfigurado) {
    const usuario = await getUsuario();
    if (usuario) redirect("/admin");
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-20">
      <h1 className="text-2xl font-bold tracking-tight text-navy">Ingresar</h1>
      <p className="mt-1 text-sm text-slate-600">
        Área privada del equipo de la fundación. Los usuarios se crean desde Supabase Auth.
      </p>

      {!supabaseConfigurado && (
        <div className="mt-6">
          <AvisoConfiguracion />
        </div>
      )}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <LoginForm destino={destino} />
      </div>
    </div>
  );
}
