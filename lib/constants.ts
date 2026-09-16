import type {
  CategoriaMeta,
  EspecieMascota,
  EstadoAdopcion,
  EstadoMeta,
  SexoMascota,
  TamanoMascota,
  TipoAliado,
} from "@/types";

/**
 * Dominio de producción. Los QR apuntan siempre aquí, también en desarrollo:
 * un QR impreso con `localhost` no le sirve a nadie.
 */
export const SITE_URL = "https://proyectosanlazaro.com";

export const FUNDACION = {
  nombre: "Fundación San Lázaro",
  lema: "Rescatamos, curamos y buscamos un hogar",
  descripcion:
    "Somos una fundación de rescate animal. Atendemos perros y gatos en situación de calle, los recuperamos y los acompañamos hasta que encuentran una familia.",
  email: "contacto@proyectosanlazaro.com",
  telefono: "+58 414-751-9346",
  /** Click-to-chat: el número va sin espacios ni guiones, con código de país. */
  whatsapp: "https://wa.me/584147519346",
  instagram: "https://www.instagram.com/refugiosanlazaro/",
  instagramCuenta: "@refugiosanlazaro",
} as const;

/**
 * Movimiento Alpha: aliado del refugio, no es un canal de contacto propio.
 * Va aparte de `FUNDACION` justamente para que no se mezcle con los datos
 * de contacto del refugio.
 */
export const ALIADO_ALPHA = {
  nombre: "Movimiento Alpha",
  instagram: "https://www.instagram.com/alphauniversidad/",
  instagramCuenta: "@alphauniversidad",
} as const;

export const NAVEGACION = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/adopciones", etiqueta: "Adopciones" },
  { href: "/donaciones", etiqueta: "Donaciones" },
  { href: "/aliados", etiqueta: "Aliados" },
  { href: "/galeria", etiqueta: "Galería" },
] as const;

/** Módulos del panel, en el orden en que salen las pestañas de `/admin`. */
export const NAVEGACION_ADMIN = [
  { href: "/admin/mascotas", etiqueta: "Mascotas" },
  { href: "/admin/aliados", etiqueta: "Aliados" },
  { href: "/admin/galeria", etiqueta: "Galería" },
  { href: "/admin/metas", etiqueta: "Metas" },
  { href: "/admin/donaciones", etiqueta: "Donaciones" },
] as const;

/** Buckets de Supabase Storage usados por el proyecto. */
export const BUCKETS = {
  mascotas: "mascotas",
  galeria: "galeria",
  aliados: "aliados",
  donaciones: "donaciones",
} as const;

export const ETIQUETAS_ESPECIE: Record<EspecieMascota, string> = {
  perro: "Perro",
  gato: "Gato",
  otro: "Otro",
};

export const ETIQUETAS_SEXO: Record<SexoMascota, string> = {
  macho: "Macho",
  hembra: "Hembra",
};

export const ETIQUETAS_TAMANO: Record<TamanoMascota, string> = {
  pequeno: "Pequeño",
  mediano: "Mediano",
  grande: "Grande",
};

export const ETIQUETAS_ESTADO: Record<EstadoAdopcion, string> = {
  en_adopcion: "En adopción",
  adoptado: "Adoptado",
};

export const ETIQUETAS_TIPO_ALIADO: Record<TipoAliado, string> = {
  veterinaria: "Veterinaria",
  empresa: "Empresa",
  refugio: "Refugio",
  particular: "Particular",
};

export const ETIQUETAS_CATEGORIA_META: Record<CategoriaMeta, string> = {
  materiales: "Materiales",
  alimento: "Alimento",
  camas: "Camas",
  salud: "Salud",
  otro: "Otro",
};

export const ETIQUETAS_ESTADO_META: Record<EstadoMeta, string> = {
  activa: "Activa",
  cumplida: "Cumplida",
  archivada: "Archivada",
};

/** Clases de color por estado de adopción, para las insignias. */
export const COLOR_ESTADO: Record<EstadoAdopcion, string> = {
  en_adopcion: "bg-brand-100 text-brand-800 ring-brand-600/20",
  adoptado: "bg-slate-200 text-slate-700 ring-slate-500/20",
};
