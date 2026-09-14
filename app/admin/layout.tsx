import { AdminNav } from "@/components/AdminNav";
import { supabaseConfigurado } from "@/lib/env";
import { getUsuario } from "@/lib/supabase/server";

/**
 * Envuelve todo `/admin/*` con la barra del panel.
 *
 * Lee la sesión **solo para mostrar el correo**: la protección sigue viviendo
 * en cada `page.tsx`, que es quien hace `redirect("/login?next=…")`. Los
 * layouts y las páginas se renderizan en paralelo, así que un guard aquí no
 * impediría que la página se ejecutara; duplicarlo solo añadiría una segunda
 * fuente de verdad que podría quedar desincronizada.
 *
 * Por eso `email` puede ser `null` sin romper nada: cuando no hay sesión, la
 * página ya está redirigiendo y esta barra no llega a verse. El guard de
 * `supabaseConfigurado` evita que `getUsuario()` lance si faltan las llaves.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const usuario = supabaseConfigurado ? await getUsuario() : null;

  return (
    <>
      <AdminNav email={usuario?.email ?? null} />
      {children}
    </>
  );
}
