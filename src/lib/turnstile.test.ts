import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyTurnstile } from "@/lib/turnstile";

describe("verifyTurnstile", () => {
  const realFetch = global.fetch;
  beforeEach(() => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
  });
  afterEach(() => {
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("returns false with no token (fails closed)", async () => {
    global.fetch = vi.fn();
    expect(await verifyTurnstile("")).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns false when the secret is not configured (fails closed)", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    global.fetch = vi.fn();
    expect(await verifyTurnstile("tok")).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns true when Cloudflare reports success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    expect(await verifyTurnstile("good-token", "1.2.3.4")).toBe(true);
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("siteverify");
    expect((init.body as URLSearchParams).get("response")).toBe("good-token");
    expect((init.body as URLSearchParams).get("remoteip")).toBe("1.2.3.4");
  });

  it("returns false when Cloudflare reports failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: false }) });
    expect(await verifyTurnstile("bad-token")).toBe(false);
  });

  it("returns false on a network error (fails closed)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network"));
    expect(await verifyTurnstile("tok")).toBe(false);
  });
});
