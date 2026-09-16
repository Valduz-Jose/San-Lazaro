"use client";

import { Check, Link as IconoEnlace, Share2 } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { IconoFacebook, IconoWhatsApp } from "@/components/icons";
import { FUNDACION } from "@/lib/constants";

/** Pastilla de ícono + etiqueta, con el mismo aspecto que las filas del footer. */
const CLASE_BOTON = "group flex items-center gap-3 text-left";

function Pastilla({ children }: { children: ReactNode }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-teal-700 ring-1 ring-slate-200 transition-colors group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600">
      {children}
    </span>
  );
}

function Etiqueta({ children }: { children: ReactNode }) {
  return (
    <span className="text-sm font-medium text-slate-700 transition-colors group-hover:text-brand-700">
      {children}
    </span>
  );
}

/**
 * `navigator.share` solo existe en el navegador, así que en el servidor (y
 * durante la hidratación) vale `false`; así el HTML coincide y el botón
 * aparece justo después, solo donde está disponible.
 */
function useWebShare(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function",
    () => false,
  );
}

type EstadoCopia = "inactivo" | "copiado" | "error";

export function CompartirMascota({ nombre, url }: { nombre: string; url: string }) {
  const webShare = useWebShare();
  const [copia, setCopia] = useState<EstadoCopia>("inactivo");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  const mensaje = `Conoce a ${nombre} en ${FUNDACION.nombre}: ${url}`;
  const enlaceWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  const enlaceFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  async function copiarEnlace() {
    let estado: EstadoCopia = "copiado";
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Sin permiso o fuera de un contexto seguro (http que no sea localhost).
      estado = "error";
    }

    setCopia(estado);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setCopia("inactivo"), 2000);
  }

  async function compartirNativo() {
    try {
      await navigator.share({ title: `${nombre} | ${FUNDACION.nombre}`, text: mensaje, url });
    } catch {
      // El usuario cerró el menú de compartir: no es un error que mostrar.
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-navy">Compartir</h2>
      <p className="mt-1 text-sm text-slate-600">
        Ayuda a que {nombre} llegue a más personas.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {webShare && (
          <li>
            <button type="button" onClick={compartirNativo} className={CLASE_BOTON}>
              <Pastilla>
                <Share2 className="size-4" aria-hidden />
              </Pastilla>
              <Etiqueta>Compartir</Etiqueta>
            </button>
          </li>
        )}

        <li>
          <a
            href={enlaceWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className={CLASE_BOTON}
          >
            <Pastilla>
              <IconoWhatsApp className="size-4" />
            </Pastilla>
            <Etiqueta>WhatsApp</Etiqueta>
          </a>
        </li>

        <li>
          <a
            href={enlaceFacebook}
            target="_blank"
            rel="noopener noreferrer"
            className={CLASE_BOTON}
          >
            <Pastilla>
              <IconoFacebook className="size-4" />
            </Pastilla>
            <Etiqueta>Facebook</Etiqueta>
          </a>
        </li>

        <li>
          <button type="button" onClick={copiarEnlace} className={CLASE_BOTON}>
            <Pastilla>
              {copia === "copiado" ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <IconoEnlace className="size-4" aria-hidden />
              )}
            </Pastilla>
            <Etiqueta>
              {copia === "copiado"
                ? "¡Enlace copiado!"
                : copia === "error"
                  ? "No se pudo copiar"
                  : "Copiar enlace"}
            </Etiqueta>
          </button>
        </li>
      </ul>

      {/* Anuncia el resultado a lectores de pantalla sin mover el foco. */}
      <p className="sr-only" aria-live="polite">
        {copia === "copiado" ? "Enlace copiado al portapapeles" : ""}
      </p>
    </div>
  );
}
