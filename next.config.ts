import type { NextConfig } from "next";

/**
 * `next/image` solo carga imágenes de dominios declarados. Derivamos el host
 * del proyecto desde NEXT_PUBLIC_SUPABASE_URL para no repetirlo a mano.
 */
function hostDeSupabase(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  try {
    return new URL(url).hostname;
  } catch {
    console.warn("[san-lazaro] NEXT_PUBLIC_SUPABASE_URL no es una URL válida.");
    return null;
  }
}

const host = hostDeSupabase();

const nextConfig: NextConfig = {
  // Las rutas de QR (lib/qr.ts) leen el logo desde disco, y `public/` no entra en el
  // bundle del servidor si no se pide explícitamente.
  outputFileTracingIncludes: {
    "/adopciones/*/qr": ["./public/logo-san-lazaro-transparente.png"],
    "/admin/mascotas/exportar-qr": ["./public/logo-san-lazaro-transparente.png"],
  },
  experimental: {
    serverActions: {
      // Las fotos de donaciones se suben a través de una server action.
      // El límite por defecto (1 MB) se queda corto para fotos de teléfono.
      bodySizeLimit: "8mb",
    },
  },
  images: {
    remotePatterns: host
      ? [
          {
            protocol: "https",
            hostname: host,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
