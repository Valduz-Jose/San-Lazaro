import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import QRCode from "qrcode";
import sharp from "sharp";

import { SITE_URL } from "@/lib/constants";

/**
 * QR de marca para las fichas de adopción. Lo usan la ruta pública
 * `/adopciones/[id]/qr` y la exportación masiva del panel.
 */

const COLOR_OSCURO = "#0247B3";
const COLOR_CLARO = "#FFFFFF";

/** Lado de la imagen final en px: sobra para imprimir plaquitas y flyers. */
const TAMANO_QR = 1024;

/**
 * Proporciones respecto al lado de la imagen. Con corrección "H" el QR
 * tolera ~30 % de módulos perdidos; el círculo tapa bastante menos.
 */
const PROPORCION_CIRCULO = 0.26;
const PROPORCION_LOGO = 0.19;

/**
 * Ruta al logo. Está en `public/`, que no se incluye en el bundle del
 * servidor por defecto: `next.config.ts` lo añade con
 * `outputFileTracingIncludes` para estas rutas.
 */
const RUTA_LOGO = path.join(process.cwd(), "public", "logo-san-lazaro-transparente.png");

/** Logo ya redimensionado; es igual para todos los QR, así que se cachea. */
let logoPreparado: Promise<Buffer> | null = null;

function prepararLogo(): Promise<Buffer> {
  logoPreparado ??= readFile(RUTA_LOGO)
    .then((logo) => {
      const lado = Math.round(TAMANO_QR * PROPORCION_LOGO);
      return sharp(logo)
        .resize(lado, lado, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    })
    .catch((error: unknown) => {
      // No dejes cacheado un fallo: el siguiente request lo reintenta.
      logoPreparado = null;
      throw error;
    });

  return logoPreparado;
}

/** URL pública de la ficha, siempre con el dominio de producción. */
export function urlFichaMascota(id: string): string {
  return `${SITE_URL}/adopciones/${id}`;
}

/** URL pública de la imagen del QR, siempre con el dominio de producción. */
export function urlQrMascota(id: string): string {
  return `${urlFichaMascota(id)}/qr`;
}

/** "Canela Ñoña" → "qr-canela-nona.png". */
export function nombreArchivoQr(nombre: string): string {
  const slug = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `qr-${slug || "mascota"}.png`;
}

/** PNG del QR de la ficha de una mascota, con el logo sobre un círculo blanco. */
export async function generarQrMascota(id: string): Promise<Buffer> {
  const [qr, logo] = await Promise.all([
    QRCode.toBuffer(urlFichaMascota(id), {
      type: "png",
      errorCorrectionLevel: "H",
      width: TAMANO_QR,
      margin: 2,
      color: { dark: COLOR_OSCURO, light: COLOR_CLARO },
    }),
    prepararLogo(),
  ]);

  const lado = (await sharp(qr).metadata()).width ?? TAMANO_QR;
  const radio = Math.round((lado * PROPORCION_CIRCULO) / 2);
  const circulo = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${radio * 2}" height="${radio * 2}">` +
      `<circle cx="${radio}" cy="${radio}" r="${radio}" fill="${COLOR_CLARO}"/></svg>`,
  );

  return sharp(qr)
    .composite([
      { input: circulo, gravity: "center" },
      { input: logo, gravity: "center" },
    ])
    .png()
    .toBuffer();
}
