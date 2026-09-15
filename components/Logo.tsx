import Image from "next/image";

import logoSanLazaro from "@/public/logo-san-lazaro-transparente.png";
import { cn } from "@/lib/utils";

/**
 * Marca del refugio. Es el mismo archivo en la cabecera, el pie y el panel;
 * solo cambia el tamaño, y el `px` que se le pasa manda tanto en el layout
 * como en el ancho que pide el optimizador de `next/image`.
 *
 * Va sin texto alternativo por defecto: en los tres sitios donde se usa hay
 * un rótulo con el nombre al lado, y repetirlo solo duplicaría el anuncio
 * del lector de pantalla.
 */
export function Logo({
  px = 36,
  alt = "",
  prioritaria = false,
  className,
}: {
  px?: number;
  alt?: string;
  prioritaria?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={logoSanLazaro}
      alt={alt}
      width={px}
      height={px}
      priority={prioritaria}
      className={cn("shrink-0 rounded-full object-contain", className)}
    />
  );
}
