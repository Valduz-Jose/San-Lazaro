-- ============================================================
-- Fundación San Lázaro — esquema de base de datos
-- Ejecuta este archivo en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ---------- Tipos ----------
create type especie_mascota as enum ('perro', 'gato', 'otro');
create type sexo_mascota    as enum ('macho', 'hembra');
create type tamano_mascota  as enum ('pequeno', 'mediano', 'grande');
create type estado_adopcion as enum ('en_adopcion', 'adoptado');
create type tipo_aliado     as enum ('veterinaria', 'empresa', 'refugio', 'particular');

-- ---------- Tablas ----------
create table mascotas (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  especie            especie_mascota not null,
  sexo               sexo_mascota not null,
  raza               text,
  edad_meses         integer check (edad_meses >= 0),
  tamano             tamano_mascota,
  descripcion        text,
  historia           text,
  estado             estado_adopcion not null default 'en_adopcion',
  esterilizado       boolean not null default false,
  vacunado           boolean not null default false,
  -- Ruta dentro del bucket `mascotas` (p. ej. 'perros/luna.jpg'), no la URL completa.
  imagen_url         text,
  -- Foto con la nueva familia, se llena cuando la mascota es adoptada.
  imagen_familia_url text,
  fecha_rescate      date,
  created_at         timestamptz not null default now()
);

create table aliados (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  tipo        tipo_aliado not null,
  descripcion text,
  sitio_web   text,
  logo_url    text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table galeria (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descripcion text,
  imagen_url  text not null,
  categoria   text,
  destacada   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Necesidades del refugio: lo que hace falta y cuánto se lleva reunido.
create table metas (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null,
  descripcion    text,
  categoria      text check (categoria in ('materiales', 'alimento', 'camas', 'salud', 'otro')),
  unidad         text not null,
  monto_objetivo numeric not null check (monto_objetivo > 0),
  monto_actual   numeric not null default 0,
  estado         text not null default 'activa'
                 check (estado in ('activa', 'cumplida', 'archivada')),
  created_at     timestamptz not null default now()
);

-- Donaciones en especie: cada aporte suma a la meta que lo recibe.
create table donaciones (
  id             uuid primary key default gen_random_uuid(),
  meta_id        uuid not null references metas (id) on delete cascade,
  -- Null cuando la donación es anónima.
  donante_nombre text,
  es_anonima     boolean not null default false,
  cantidad       numeric not null check (cantidad > 0),
  -- Ruta dentro del bucket `donaciones` (p. ej. '2026/sacos-alimento.jpg').
  imagen_url     text not null,
  created_at     timestamptz not null default now()
);

create index mascotas_estado_idx   on mascotas (estado);
create index mascotas_especie_idx  on mascotas (especie);
create index galeria_destacada_idx on galeria (destacada, created_at desc);
create index metas_estado_idx      on metas (estado);
create index donaciones_meta_idx   on donaciones (meta_id, created_at desc);

-- ---------- Sincronización de metas ----------
-- Mantiene `metas.monto_actual` al día con las donaciones registradas.
create or replace function sincronizar_monto_meta()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update metas
       set monto_actual = monto_actual + new.cantidad
     where id = new.meta_id;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Resta el aporte anterior y suma el nuevo. Se hace en dos pasos porque la
    -- donación pudo cambiar de meta, no solo de cantidad.
    update metas
       set monto_actual = greatest(monto_actual - old.cantidad, 0)
     where id = old.meta_id;

    update metas
       set monto_actual = monto_actual + new.cantidad
     where id = new.meta_id;
    return new;
  end if;

  if tg_op = 'DELETE' then
    update metas
       set monto_actual = greatest(monto_actual - old.cantidad, 0)
     where id = old.meta_id;
    return old;
  end if;

  return null;
end;
$$;

create trigger donaciones_sincronizan_meta
  after insert or update or delete on donaciones
  for each row execute function sincronizar_monto_meta();

-- ---------- Row Level Security ----------
alter table mascotas   enable row level security;
alter table aliados    enable row level security;
alter table galeria    enable row level security;
alter table metas      enable row level security;
alter table donaciones enable row level security;

-- Lectura pública del contenido del sitio.
create policy "mascotas visibles para todos"
  on mascotas for select using (true);

create policy "aliados activos visibles para todos"
  on aliados for select using (activo);

create policy "galeria visible para todos"
  on galeria for select using (true);

create policy "metas visibles para todos"
  on metas for select using (true);

-- El historial de donaciones es público (la app oculta el nombre si es anónima).
create policy "donaciones visibles para todos"
  on donaciones for select using (true);

-- Solo el equipo autenticado administra el contenido.
create policy "equipo administra mascotas"
  on mascotas for all to authenticated using (true) with check (true);

create policy "equipo administra aliados"
  on aliados for all to authenticated using (true) with check (true);

create policy "equipo administra galeria"
  on galeria for all to authenticated using (true) with check (true);

create policy "equipo administra metas"
  on metas for all to authenticated using (true) with check (true);

create policy "equipo registra donaciones"
  on donaciones for insert to authenticated with check (true);

create policy "equipo actualiza donaciones"
  on donaciones for update to authenticated using (true) with check (true);

create policy "equipo borra donaciones"
  on donaciones for delete to authenticated using (true);

-- ---------- Storage ----------
insert into storage.buckets (id, name, public)
values ('mascotas',   'mascotas',   true),
       ('galeria',    'galeria',    true),
       ('aliados',    'aliados',    true),
       ('donaciones', 'donaciones', true)
on conflict (id) do nothing;

create policy "imagenes publicas"
  on storage.objects for select
  using (bucket_id in ('mascotas', 'galeria', 'aliados', 'donaciones'));

create policy "equipo sube imagenes"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('mascotas', 'galeria', 'aliados', 'donaciones'));

create policy "equipo actualiza imagenes"
  on storage.objects for update to authenticated
  using (bucket_id in ('mascotas', 'galeria', 'aliados', 'donaciones'));

create policy "equipo borra imagenes"
  on storage.objects for delete to authenticated
  using (bucket_id in ('mascotas', 'galeria', 'aliados', 'donaciones'));
