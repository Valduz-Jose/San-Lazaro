import { exigirSesion } from "@/lib/admin";
import { generarExcelMascotas } from "@/lib/exportar-mascotas";
import { obtenerMascotas } from "@/lib/queries";

/** Descarga un Excel con los datos de todas las mascotas. Solo con sesión iniciada. */
export async function GET() {
  const sinSesion = await exigirSesion();
  if (sinSesion) return new Response(sinSesion.error, { status: 401 });

  const contenido = await generarExcelMascotas(await obtenerMascotas());

  return new Response(contenido, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="mascotas-san-lazaro.xlsx"',
      "Content-Length": String(contenido.byteLength),
    },
  });
}
