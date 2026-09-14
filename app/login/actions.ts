"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { supabaseConfigurado } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { esEmailValido } from "@/lib/utils";
import type { ResultadoFormulario } from "@/types";

/** Inicia sesión con correo y contraseña (usuarios creados en Supabase Auth). */
export async function iniciarSesion(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const destino = String(formData.get("next") ?? "/admin") || "/admin";

  if (!esEmailValido(email)) return { ok: false, error: "El correo no es válido." };
  if (password.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }

  if (!supabaseConfigurado) {
    return {
      ok: false,
      error: "Supabase no está configurado todavía. Completa .env.local para iniciar sesión.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { ok: false, error: "Correo o contraseña incorrectos." };

  revalidatePath("/", "layout");
  redirect(destino.startsWith("/") ? destino : "/admin");
}

export async function cerrarSesion() {
  if (supabaseConfigurado) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/");
}
