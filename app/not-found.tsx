import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-5xl">🐾</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-navy">
        No encontramos esta página
      </h1>
      <p className="mt-2 text-slate-600">
        Puede que el enlace esté roto o que el registro ya no exista.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
