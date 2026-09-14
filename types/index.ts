export type {
  Database,
  MascotaRow,
  AliadoRow,
  FotoGaleriaRow,
  MetaRow,
  DonacionRow,
  EspecieMascota,
  SexoMascota,
  TamanoMascota,
  EstadoAdopcion,
  TipoAliado,
  CategoriaMeta,
  EstadoMeta,
} from "./database";

import type {
  AliadoRow,
  DonacionRow,
  FotoGaleriaRow,
  MascotaRow,
  MetaRow,
} from "./database";

/** Alias de dominio: es lo que consumen las páginas y componentes. */
export type Mascota = MascotaRow;
export type Aliado = AliadoRow;
export type FotoGaleria = FotoGaleriaRow;
export type Meta = MetaRow;
export type Donacion = DonacionRow;

/** Donación con la meta a la que aporta, para el historial público. */
export type DonacionConMeta = DonacionRow & { meta: Pick<MetaRow, "titulo" | "unidad"> };

/** Filtros disponibles en el listado de adopciones. */
export type FiltrosMascota = {
  especie?: MascotaRow["especie"];
  estado?: MascotaRow["estado"];
  tamano?: MascotaRow["tamano"];
};

/**
 * Campos de texto tal como los envió el usuario, indexados por `name`.
 *
 * React resetea el `<form>` en cuanto termina la server action, también
 * cuando devuelve error. Si la action los incluye en su respuesta, el
 * formulario puede usarlos como valores por defecto y el reset deja de
 * borrar lo que el usuario llevaba escrito.
 */
export type ValoresFormulario = Record<string, string>;

/** Resultado uniforme que devuelven las server actions de formularios. */
export type ResultadoFormulario =
  | { ok: true; mensaje: string }
  | { ok: false; error: string; valores?: ValoresFormulario }
  | null;
