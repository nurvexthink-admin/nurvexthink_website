import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Service-role Supabase client — bypasses Row-Level Security. SERVER-ONLY.
 *
 * Used for writes that must happen through a verified server action rather than
 * directly from the browser (e.g. saving a lead after the Turnstile check), so
 * the `orders` table can drop its public anon INSERT policy. The service key is
 * read from a non-public env var and never reaches the client bundle.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Service-role client needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
