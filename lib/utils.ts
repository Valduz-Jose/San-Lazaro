import type { ValoresFormulario } from "@/types";

/** Une clases de Tailwind ignorando valores vacíos, sin dependencias extra. */
export function cn(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(" ");
}

/** "18 meses" → "1 año y 6 meses". Devuelve "Edad no registrada" si falta. */
export function formatearEdad(edadMeses: number | null): string {
  if (edadMeses === null || edadMeses < 0) return "Edad no registrada";
  if (edadMeses < 1) return "Recién nacido";
  if (edadMeses < 12) return `${edadMeses} ${edadMeses === 1 ? "mes" : "meses"}`;

  const anios = Math.floor(edadMeses / 12);
  const meses = edadMeses % 12;
  const textoAnios = `${anios} ${anios === 1 ? "año" : "años"}`;

  if (meses === 0) return textoAnios;

  return `${textoAnios} y ${meses} ${meses === 1 ? "mes" : "meses"}`;
}

export function formatearFecha(fecha: string | null): string {
  if (!fecha) return "—";

  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(fecha));
}

/**
 * Formatea una cantidad de una meta o donación: 50 → "50", 12.5 → "12,5".
 * Acepta string porque PostgREST puede devolver `numeric` como texto.
 */
export function formatearCantidad(valor: number | string | null): string {
  if (valor === null) return "0";

  const numero = typeof valor === "number" ? valor : Number(valor);
  if (Number.isNaN(numero)) return "0";

  return new Intl.NumberFormat("es", { maximumFractionDigits: 2 }).format(numero);
}

/** Porcentaje de avance de una meta, acotado entre 0 y 100. */
export function porcentajeMeta(actual: number, objetivo: number): number {
  if (!objetivo || objetivo <= 0) return 0;

  return Math.min(100, Math.max(0, Math.round((Number(actual) / Number(objetivo)) * 100)));
}

/** Una meta está cumplida cuando lo reunido alcanza o supera el objetivo. */
export function metaCumplida(actual: number, objetivo: number): boolean {
  return Number(actual) >= Number(objetivo);
}

/** Validación mínima de correo, suficiente para formularios públicos. */
export function esEmailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

/**
 * Copia los campos de texto de un formulario para devolverlos cuando la
 * validación falla (ver `ValoresFormulario`). Los archivos quedan fuera: por
 * seguridad el navegador no deja repoblar un `<input type="file">`.
 */
export function valoresEnviados(formData: FormData): ValoresFormulario {
  const valores: ValoresFormulario = {};

  for (const [campo, valor] of formData.entries()) {
    if (typeof valor === "string") valores[campo] = valor;
  }

  return valores;
}
