-- ============================================================
-- Datos de ejemplo (opcional). Ejecútalo después de schema.sql.
--
-- Nota: `metas.monto_actual` NO se inserta a mano. El trigger
-- `donaciones_sincronizan_meta` lo calcula al insertar las donaciones del final.
-- Las rutas de imagen apuntan a los buckets; súbelas o déjalas como están.
-- ============================================================

-- ---------- Metas ----------
insert into metas (titulo, descripcion, categoria, unidad, monto_objetivo, estado)
values
  ('Alimento para el mes',
   'Comida balanceada para los 38 perros y gatos que tenemos en el refugio.',
   'alimento', 'kg', 300, 'activa'),

  ('Camitas para el invierno',
   'Camas acolchadas para que ninguno duerma en el piso frío.',
   'camas', 'unidades', 40, 'activa'),

  ('Techo del área de cuarentena',
   'Láminas, vigas y tornillería para reparar el techo donde aislamos a los recién llegados.',
   'materiales', 'láminas', 25, 'activa');

-- ---------- Mascotas ----------
insert into mascotas (nombre, especie, sexo, raza, edad_meses, tamano, descripcion, historia, estado, esterilizado, vacunado, imagen_url, imagen_familia_url, fecha_rescate)
values
  ('Luna', 'perro', 'hembra', 'Mestiza', 14, 'mediano',
   'Cariñosa, se lleva bien con niños y con otros perros.',
   'La encontramos en la carretera vieja, deshidratada y con sarna. Tras tres meses de tratamiento hoy está sana y llena de energía.',
   'en_adopcion', true, true, 'perros/luna.jpg', null, '2025-11-02'),

  ('Milo', 'gato', 'macho', 'Criollo', 6, 'pequeno',
   'Juguetón y muy sociable. Ideal para apartamento.',
   'Rescatado del motor de un auto junto a sus dos hermanos.',
   'en_adopcion', false, true, 'gatos/milo.jpg', null, '2026-02-18'),

  ('Nube', 'gato', 'hembra', 'Angora mestiza', 24, 'pequeno',
   'Independiente y limpia. Prefiere hogares sin perros.',
   'Llegó con una fractura en la pata que sanó completamente. Hoy vive con la familia Rodríguez.',
   'adoptado', true, true, 'gatos/nube.jpg', 'adopciones/nube-familia.jpg', '2025-08-21');

-- ---------- Aliados ----------
insert into aliados (nombre, tipo, descripcion, sitio_web, logo_url)
values
  ('Veterinaria Patitas', 'veterinaria',
   'Atiende urgencias y esterilizaciones a precio solidario.',
   'https://ejemplo.com', 'logos/patitas.png'),

  ('Alimentos del Valle', 'empresa',
   'Dona alimento balanceado cada mes.',
   'https://ejemplo.com', 'logos/alimentos-del-valle.png'),

  ('María Fernández', 'particular',
   'Voluntaria de transporte y jornadas de adopción.',
   null, null);

-- ---------- Galería ----------
insert into galeria (titulo, descripcion, imagen_url, categoria, destacada)
values
  ('Jornada de vacunación', 'Vacunamos a 42 animales en un solo día.',
   'jornadas/vacunacion-2026.jpg', 'jornadas', true),

  ('Rescate en la vía', 'Luna el día que la encontramos.',
   'rescates/luna-rescate.jpg', 'rescates', false),

  ('Nube en su nuevo hogar', 'Final feliz después de un año en el refugio.',
   'adopciones/nube-hogar.jpg', 'adopciones', true);

-- ---------- Donaciones ----------
-- Cada insert dispara el trigger y suma a `metas.monto_actual`.
insert into donaciones (meta_id, donante_nombre, es_anonima, cantidad, imagen_url)
values
  ((select id from metas where titulo = 'Alimento para el mes'),
   'María Fernández', false, 50, 'donaciones/alimento-maria.jpg'),

  ((select id from metas where titulo = 'Alimento para el mes'),
   null, true, 75, 'donaciones/alimento-anonimo.jpg'),

  ((select id from metas where titulo = 'Alimento para el mes'),
   'Alimentos del Valle', false, 120, 'donaciones/alimento-del-valle.jpg'),

  ((select id from metas where titulo = 'Camitas para el invierno'),
   'Familia Rodríguez', false, 12, 'donaciones/camitas-rodriguez.jpg'),

  ((select id from metas where titulo = 'Techo del área de cuarentena'),
   'Ferretería El Tornillo', false, 8, 'donaciones/laminas-tornillo.jpg');

-- Comprobación rápida: monto_actual debe quedar en 245 / 12 / 8.
-- select titulo, monto_actual, monto_objetivo, unidad from metas order by titulo;
