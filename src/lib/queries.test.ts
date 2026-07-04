import { describe, it, expect } from "vitest";
import { toProduct } from "@/lib/queries";
import type { ProductRow } from "@/lib/supabase/types";

const row: ProductRow = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "fluxboard",
  name: "FluxBoard",
  tagline: null,
  summary: "A keyboard-first project board.",
  highlights: [],
  description: "Long text",
  technical_details: null,
  cover_image: null,
  gallery: [],
  category_id: null,
  category_name: "Productivity",
  tech: ["Next.js", "Realtime"],
  lifecycle: "beta",
  year: "2026",
  live_url: "#",
  repo_url: null,
  featured: true,
  sort_order: 10,
  status: "published",
  seo_description: null,
  og_image: null,
  published_at: "2026-07-01T00:00:00Z",
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-07-01T00:00:00Z",
};

describe("toProduct", () => {
  it("maps lifecycle to the UI status label", () => {
    expect(toProduct(row).status).toBe("Beta");
    expect(toProduct({ ...row, lifecycle: "live" }).status).toBe("Live");
    expect(toProduct({ ...row, lifecycle: "soon" }).status).toBe("Soon");
  });

  it("maps tech to the UI tags array", () => {
    expect(toProduct(row).tags).toEqual(["Next.js", "Realtime"]);
  });

  it("keeps the existing null-safety defaults", () => {
    const bare = { ...row, summary: null, description: null, year: null, live_url: null, category_name: null };
    const p = toProduct(bare);
    expect(p.summary).toBe("");
    expect(p.description).toBe("");
    expect(p.year).toBe("");
    expect(p.liveUrl).toBe("#");
    expect(p.category).toBe("Software");
  });
});
