import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { FUNDACION } from "@/lib/constants";

import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: `${FUNDACION.nombre} — Rescate animal`,
    template: `%s | ${FUNDACION.nombre}`,
  },
  description: FUNDACION.descripcion,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
