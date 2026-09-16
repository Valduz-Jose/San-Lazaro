import { exigirSesion } from "@/lib/admin";
import { generarZipQr } from "@/lib/exportar-mascotas";
import { obtenerMascotas } from "@/lib/queries";

/** Descarga un zip con el QR de cada mascota. Solo con sesión iniciada. */
export async function GET() {
  const sinSesion = await exigirSesion();
  if (sinSesion) return new Response(sinSesion.error, { status: 401 });

  const contenido = await generarZipQr(await obtenerMascotas());

  return new Response(contenido, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="san-lazaro-qrs.zip"',
      "Content-Length": String(contenido.byteLength),
    },
  });
}
