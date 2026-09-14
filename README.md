# San Lázaro

Sitio web de la **Fundación San Lázaro** (rescate animal) para gestionar:

- **Metas y donaciones en especie** — cada meta es una necesidad concreta del refugio (300 kg de
  alimento, 40 camitas…) con barra de progreso. El historial de donantes es público; el registro
  de donaciones lo hace el equipo desde `/admin/donaciones`, con foto obligatoria.
- **Aliados** — veterinarias, empresas, refugios y voluntarios que apoyan la fundación.
- **Galería de fotos** — mosaico con visor a pantalla completa, servido desde Supabase Storage.
- **Registro de mascotas en adopción** — listado con filtros, ficha individual y foto con la
  nueva familia cuando la adopción se concreta.
- **Panel privado** (`/admin`) — resumen interno protegido con Supabase Auth.

## Stack

| Pieza | Tecnología |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Lenguaje | TypeScript (modo estricto) |
| Estilos | Tailwind CSS v4 |
| Backend | Supabase — Postgres, Auth y Storage |
| Clientes Supabase | `@supabase/supabase-js` + `@supabase/ssr` |

## Requisitos

- Node.js 20 o superior (probado con Node 22)
- npm 10 o superior
- Una cuenta gratuita en [supabase.com](https://supabase.com)

## Cómo correr el proyecto localmente

### 1. Instala las dependencias

```bash
npm install
```

### 2. Crea el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. Abre **SQL Editor → New query**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo.
   Eso crea las tablas (`mascotas`, `aliados`, `galeria`, `metas`, `donaciones`), el trigger que
   mantiene `metas.monto_actual`, las políticas de Row Level Security y los buckets de Storage.
3. *(Opcional)* Ejecuta también [`supabase/seed.sql`](supabase/seed.sql) para tener datos de ejemplo.

### 3. Configura las variables de entorno

```bash
cp .env.local.example .env.local
```

> En Windows (PowerShell): `Copy-Item .env.local.example .env.local`

Abre `.env.local` y completa los valores que encuentras en
**Supabase Dashboard → Project Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

La clave `anon` es pública por diseño: la seguridad la dan las políticas RLS del paso anterior.
**Nunca** pongas aquí la `service_role`.

### 4. Arranca el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

> El sitio arranca aunque todavía no hayas puesto las credenciales: en lugar de fallar,
> muestra un aviso de "Supabase todavía no está configurado". Después de editar
> `.env.local` reinicia `npm run dev` para que Next.js lea las variables.

### 5. Crea tu usuario de administrador

El panel `/admin` usa correo y contraseña. Crea el usuario en
**Supabase Dashboard → Authentication → Users → Add user** y luego entra en
[http://localhost:3000/login](http://localhost:3000/login).

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en `localhost:3000` |
| `npm run build` | Compilación de producción |
| `npm start` | Sirve la compilación de producción |
| `npm run lint` | ESLint |

## Estructura del proyecto

```
san-lazaro/
├── app/                       # App Router: rutas, layouts y server actions
│   ├── layout.tsx             # Layout raíz (header, footer, sesión)
│   ├── page.tsx               # Portada con métricas y destacados
│   ├── adopciones/
│   │   ├── page.tsx           # Listado con filtros (?especie=&estado=&tamano=)
│   │   └── [id]/page.tsx      # Ficha individual de la mascota
│   ├── donaciones/
│   │   ├── page.tsx           # Metas activas con barra de progreso (pública)
│   │   └── [id]/page.tsx      # Detalle de meta + historial de donantes
│   ├── aliados/page.tsx
│   ├── galeria/page.tsx
│   ├── login/
│   │   ├── page.tsx
│   │   └── actions.ts         # Server actions: iniciarSesion, cerrarSesion
│   ├── admin/
│   │   ├── page.tsx           # Panel privado (requiere sesión)
│   │   ├── metas/
│   │   │   ├── page.tsx       # Alta, edición, estado y borrado de metas
│   │   │   └── actions.ts     # crearMeta, actualizarMeta, cambiarEstadoMeta, eliminarMeta
│   │   └── donaciones/
│   │       ├── page.tsx       # Alta de donaciones + tabla de las recientes
│   │       └── actions.ts     # registrarDonacion, eliminarDonacion
│   ├── not-found.tsx
│   └── globals.css            # Entrada de Tailwind v4
│
├── components/                # Componentes de UI reutilizables
│   ├── SiteHeader.tsx         # Navegación (client)
│   ├── SiteFooter.tsx
│   ├── MascotaCard.tsx
│   ├── FiltrosAdopciones.tsx  # Filtros que escriben en la URL (client)
│   ├── AliadoCard.tsx
│   ├── GaleriaGrid.tsx        # Mosaico + visor (client)
│   ├── MetaCard.tsx           # Tarjeta pública de meta y barra ProgresoMeta
│   ├── MetaAdminCard.tsx      # Fila de meta en el panel (client)
│   ├── MetaFormulario.tsx     # Alta y edición de metas (client)
│   ├── RegistrarDonacionForm.tsx      # Alta de donación con subida (client)
│   ├── BotonEliminar.tsx      # Borrado con confirmación inline (client)
│   ├── LoginForm.tsx          # (client)
│   └── ui.tsx                 # Section, Badge, EmptyState, AvisoConfiguracion
│
├── lib/                       # Lógica sin UI
│   ├── supabase/
│   │   ├── client.ts          # Cliente para el navegador
│   │   ├── server.ts          # Cliente para Server Components y actions
│   │   └── proxy.ts           # Refresco de sesión y guardia de rutas
│   ├── queries.ts             # Consultas de lectura (server-only)
│   ├── storage.ts             # URLs públicas y subida de imágenes
│   ├── constants.ts           # Datos de la fundación, etiquetas, buckets
│   ├── env.ts                 # Lectura de variables de entorno
│   └── utils.ts               # cn, formateo de edad/fecha/cantidad, progreso de metas
│
├── types/                     # Tipos compartidos
│   ├── database.ts            # Tipos de las tablas de Supabase
│   └── index.ts               # Alias de dominio y tipos de formularios
│
├── supabase/
│   ├── schema.sql             # Tablas, RLS y buckets
│   └── seed.sql               # Datos de ejemplo (opcional)
│
├── proxy.ts                   # Reemplaza a middleware.ts en Next.js 16
├── next.config.ts             # Dominios permitidos para next/image
└── .env.local.example         # Plantilla de variables de entorno
```

## Cómo cargar contenido

**Donaciones:** se registran desde `/admin/donaciones`. El formulario sube la foto al bucket
`donaciones` e inserta la fila; un trigger de Postgres actualiza `metas.monto_actual` solo.

**Metas:** se gestionan por completo desde `/admin/metas` — crear, editar, cambiar el estado
entre activa/cumplida/archivada y eliminar. Solo las metas `activa` salen en la web pública y
en el desplegable de donaciones.

**El resto (mascotas, aliados y galería):** por ahora se cargan desde el
**Table Editor** de Supabase:

1. Sube las imágenes a los buckets `mascotas`, `galeria` o `aliados` (**Storage**).
2. En las columnas `imagen_url` / `logo_url` / `imagen_familia_url` guarda **solo la ruta dentro
   del bucket** (por ejemplo `perros/luna.jpg`), no la URL completa. La app la convierte en URL
   pública.
3. Las filas nuevas aparecen en el sitio en la siguiente recarga.

## Notas técnicas

- **Sesiones:** `proxy.ts` (el sustituto de `middleware.ts` en Next.js 16) refresca el token de
  Supabase en cada navegación y redirige a `/login` si alguien entra a `/admin` sin sesión.
- **Imágenes:** `next.config.ts` deriva el host permitido de `NEXT_PUBLIC_SUPABASE_URL`, así que
  no hay que escribirlo a mano. Si cambias de proyecto Supabase, reinicia el servidor.
- **Regenerar tipos** tras modificar el esquema:
  ```bash
  npx supabase gen types typescript --project-id <tu-project-id> > types/database.ts
  ```

## Despliegue

El proyecto está listo para Vercel: importa el repositorio y define
`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en
**Settings → Environment Variables**.
