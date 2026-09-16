import { generarQrMascota, nombreArchivoQr } from "@/lib/qr";
import { obtenerMascota } from "@/lib/queries";

/** PNG con el QR de la ficha. `?download=1` lo entrega como descarga. */
export async function GET(request: Request, { params }: RouteContext<"/adopciones/[id]/qr">) {
  const { id } = await params;
  const mascota = await obtenerMascota(id);

  if (!mascota) {
    return new Response("Mascota no encontrada", { status: 404 });
  }

  const png = await generarQrMascota(mascota.id);

  const headers = new Headers({
    "Content-Type": "image/png",
    "Content-Length": String(png.length),
  });

  if (new URL(request.url).searchParams.get("download") === "1") {
    headers.set(
      "Content-Disposition",
      `attachment; filename="${nombreArchivoQr(mascota.nombre)}"`,
    );
  }

  return new Response(new Uint8Array(png), { headers });
}
