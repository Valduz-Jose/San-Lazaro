import { Mail } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { IconoInstagram, IconoWhatsApp } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { FUNDACION, NAVEGACION } from "@/lib/constants";

/**
 * Fila de contacto: ícono en pastilla + enlace, en vez de texto plano. El
 * `group` hace que la pastilla y el texto reaccionen juntos al hover.
 */
function FilaContacto({
  href,
  externo = false,
  icono,
  etiqueta,
  detalle,
}: {
  href: string;
  externo?: boolean;
  icono: ReactNode;
  etiqueta: string;
  detalle: string;
}) {
  return (
    <li>
      <a
        href={href}
        {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="group flex items-center gap-3"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-teal-700 ring-1 ring-slate-200 transition-colors group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600">
          {icono}
        </span>

        <span className="min-w-0">
          <span className="block break-all text-sm font-medium text-slate-700 transition-colors group-hover:text-brand-700">
            {etiqueta}
          </span>
          <span className="block text-xs text-teal-700">{detalle}</span>
        </span>
      </a>
    </li>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3 sm:gap-8 lg:gap-14">
        <div>
          <div className="flex items-center gap-2">
            <Logo px={36} />
            <h2 className="text-sm font-bold text-navy">{FUNDACION.nombre}</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {FUNDACION.descripcion}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold text-navy">Secciones</h2>
          <ul className="mt-3 space-y-1.5">
            {NAVEGACION.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-slate-600 transition-colors hover:text-brand-700"
                >
                  {item.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold text-navy">Contacto</h2>
          <ul className="mt-3 space-y-3">
            <FilaContacto
              href={FUNDACION.whatsapp}
              externo
              icono={<IconoWhatsApp className="size-4" />}
              etiqueta={FUNDACION.telefono}
              detalle="Escríbenos por WhatsApp"
            />

            <FilaContacto
              href={`mailto:${FUNDACION.email}`}
              icono={<Mail className="size-4" aria-hidden />}
              etiqueta={FUNDACION.email}
              detalle="Correo de contacto"
            />

            <FilaContacto
              href={FUNDACION.instagram}
              externo
              icono={<IconoInstagram className="size-4" />}
              etiqueta={FUNDACION.instagramCuenta}
              detalle="Movimiento Alpha en Instagram"
            />
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200 px-4 py-4 text-center text-xs text-teal-700">
        © {new Date().getFullYear()} {FUNDACION.nombre}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
