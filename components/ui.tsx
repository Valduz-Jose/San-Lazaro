import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Encabezado de sección reutilizable. */
export function Section({
  titulo,
  descripcion,
  accion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{titulo}</h2>
          {descripcion && <p className="mt-1 max-w-2xl text-slate-600">{descripcion}</p>}
        </div>
        {accion}
      </div>
      {children}
    </section>
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        className ?? "bg-slate-100 text-slate-700 ring-slate-500/20",
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
      <p className="text-base font-semibold text-slate-800">{titulo}</p>
      {descripcion && <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{descripcion}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

/** Aviso que aparece cuando faltan las variables de entorno de Supabase. */
export function AvisoConfiguracion() {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
      <p className="font-semibold">Supabase todavía no está configurado</p>
      <p className="mt-1">
        Copia <code className="rounded bg-amber-100 px-1">.env.local.example</code> a{" "}
        <code className="rounded bg-amber-100 px-1">.env.local</code>, completa{" "}
        <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
        <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, y
        reinicia el servidor de desarrollo.
      </p>
    </div>
  );
}
