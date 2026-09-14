"use client";

import { createBrowserClient } from "@supabase/ssr";

import { credencialesSupabase } from "@/lib/env";
import type { Database } from "@/types";

/**
 * Cliente de Supabase para componentes del navegador ("use client").
 * `createBrowserClient` ya memoiza la instancia, así que se puede llamar
 * en cada render sin crear conexiones de más.
 */
export function createClient() {
  const { url, anonKey } = credencialesSupabase();

  return createBrowserClient<Database>(url, anonKey);
}
