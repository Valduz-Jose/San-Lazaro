/**
 * Tipos de la base de datos de Supabase.
 *
 * Puedes regenerar este archivo cuando cambies el esquema:
 *   npx supabase gen types typescript --project-id <tu-project-id> > types/database.ts
 */

export type EspecieMascota = "perro" | "gato" | "otro";
export type SexoMascota = "macho" | "hembra";
export type TamanoMascota = "pequeno" | "mediano" | "grande";
export type EstadoAdopcion = "en_adopcion" | "adoptado";

export type TipoAliado = "veterinaria" | "empresa" | "refugio" | "particular";

/** `metas.categoria` y `metas.estado` son `text` con CHECK, no enums de Postgres. */
export type CategoriaMeta = "materiales" | "alimento" | "camas" | "salud" | "otro";
export type EstadoMeta = "activa" | "cumplida" | "archivada";

export type MascotaRow = {
  id: string;
  nombre: string;
  especie: EspecieMascota;
  sexo: SexoMascota;
  raza: string | null;
  edad_meses: number | null;
  tamano: TamanoMascota | null;
  descripcion: string | null;
  historia: string | null;
  estado: EstadoAdopcion;
  esterilizado: boolean;
  vacunado: boolean;
  imagen_url: string | null;
  /** Foto con la nueva familia; se llena al concretarse la adopción. */
  imagen_familia_url: string | null;
  fecha_rescate: string | null;
  created_at: string;
};

export type AliadoRow = {
  id: string;
  nombre: string;
  tipo: TipoAliado;
  descripcion: string | null;
  sitio_web: string | null;
  logo_url: string | null;
  activo: boolean;
  created_at: string;
};

export type FotoGaleriaRow = {
  id: string;
  titulo: string;
  descripcion: string | null;
  imagen_url: string;
  categoria: string | null;
  destacada: boolean;
  created_at: string;
};

/** Necesidad del refugio: cuánto se requiere y cuánto se lleva reunido. */
export type MetaRow = {
  id: string;
  titulo: string;
  descripcion: string | null;
  categoria: CategoriaMeta | null;
  /** Unidad de medida del objetivo: 'kg', 'unidades', 'bolsas'… */
  unidad: string;
  monto_objetivo: number;
  /** Lo mantiene al día el trigger `donaciones_sincronizan_meta`. */
  monto_actual: number;
  estado: EstadoMeta;
  created_at: string;
};

/** Donación en especie asociada a una meta. */
export type DonacionRow = {
  id: string;
  meta_id: string;
  /** `null` cuando la donación es anónima. */
  donante_nombre: string | null;
  es_anonima: boolean;
  cantidad: number;
  /** Ruta dentro del bucket `donaciones`. Obligatoria. */
  imagen_url: string;
  created_at: string;
};

/** Campos que la base de datos rellena sola y por eso son opcionales al insertar. */
type Insert<T, Opcionales extends keyof T> = Omit<T, "id" | "created_at" | Opcionales> &
  Partial<Pick<T, Opcionales>>;

export type Database = {
  public: {
    Tables: {
      mascotas: {
        Row: MascotaRow;
        Insert: Insert<
          MascotaRow,
          | "raza"
          | "edad_meses"
          | "tamano"
          | "descripcion"
          | "historia"
          | "estado"
          | "esterilizado"
          | "vacunado"
          | "imagen_url"
          | "imagen_familia_url"
          | "fecha_rescate"
        >;
        Update: Partial<MascotaRow>;
        Relationships: [];
      };
      aliados: {
        Row: AliadoRow;
        Insert: Insert<AliadoRow, "descripcion" | "sitio_web" | "logo_url" | "activo">;
        Update: Partial<AliadoRow>;
        Relationships: [];
      };
      galeria: {
        Row: FotoGaleriaRow;
        Insert: Insert<FotoGaleriaRow, "descripcion" | "categoria" | "destacada">;
        Update: Partial<FotoGaleriaRow>;
        Relationships: [];
      };
      metas: {
        Row: MetaRow;
        Insert: Insert<MetaRow, "descripcion" | "categoria" | "monto_actual" | "estado">;
        Update: Partial<MetaRow>;
        Relationships: [];
      };
      donaciones: {
        Row: DonacionRow;
        Insert: Insert<DonacionRow, "donante_nombre" | "es_anonima">;
        Update: Partial<DonacionRow>;
        Relationships: [
          {
            foreignKeyName: "donaciones_meta_id_fkey";
            columns: ["meta_id"];
            isOneToOne: false;
            referencedRelation: "metas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      especie_mascota: EspecieMascota;
      sexo_mascota: SexoMascota;
      tamano_mascota: TamanoMascota;
      estado_adopcion: EstadoAdopcion;
      tipo_aliado: TipoAliado;
    };
    CompositeTypes: Record<string, never>;
  };
};
