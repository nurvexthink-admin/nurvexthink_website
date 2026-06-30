import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";
import type { Database } from "./types";

/**
 * Anonymous, cookie-less Supabase client for reading public data (published
 * products and blog posts). Safe to use in Server Components for public reads;
 * RLS still restricts rows to published content.
 */
export function createPublicSupabaseClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
