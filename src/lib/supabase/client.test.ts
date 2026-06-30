import { describe, it, expect, beforeEach, vi } from "vitest";

describe("createBrowserSupabaseClient", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://axbsghyqhhdaiylcksbv.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  });

  it("returns a client exposing auth and from()", async () => {
    const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
    const client = createBrowserSupabaseClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
    expect(client.auth).toBeDefined();
  });
});
