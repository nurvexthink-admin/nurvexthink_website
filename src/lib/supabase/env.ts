function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}. Copy .env.example to .env.local.`);
  }
  return value;
}

/**
 * Reads and validates the public Supabase env vars.
 * Uses literal `process.env.NEXT_PUBLIC_*` access so Next.js inlines them into the client bundle
 * (dynamic `process.env[name]` access is NOT inlined for the browser).
 */
export function getSupabaseEnv() {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}
