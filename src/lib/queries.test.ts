import { describe, it, expect } from "vitest";
import { toProduct, toProductDetail } from "@/lib/queries";
import type { ProductRow } from "@/lib/supabase/types";

const row: ProductRow & {
  product_categories?: { name: string } | null;
  product_features?: {
    id: string; title: string; description: string | null;
    image: string | null; sort_order: number;
  }[];
  product_blog_links?: {
    sort_order: number;
    blog_posts: { slug: string; title: string; excerpt?: string | null; cover_image?: string | null } | null;
  }[];
} = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "fluxboard",
  name: "FluxBoard",
  tagline: "Standups into shipped work.",
  summary: "A keyboard-first project board.",
  highlights: ["Fast", "Realtime", "Keyboard-first"],
  description: "First para.\n\nSecond para.",
  technical_details: "Arch para.",
  cover_image: "https://cdn.example/cover.png",
  gallery: [],
  category_id: null,
  tech: ["Next.js"],
  lifecycle: "live",
  year: "2026",
  live_url: "https://fluxboard.app",
  repo_url: null,
  featured: true,
  sort_order: 10,
  status: "published",
  seo_description: null,
  og_image: null,
  include_in_chatbot: true,
  published_at: "2026-07-01T00:00:00Z",
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-07-01T00:00:00Z",
  product_categories: { name: "Productivity" },
};

describe("toProduct", () => {
  it("maps lifecycle, tech, and the quick-view fields", () => {
    const p = toProduct(row);
    expect(p.status).toBe("Live");
    expect(p.tags).toEqual(["Next.js"]);
    expect(p.tagline).toBe("Standups into shipped work.");
    expect(p.highlights).toEqual(["Fast", "Realtime", "Keyboard-first"]);
    expect(p.coverImage).toBe("https://cdn.example/cover.png");
    expect(p.featured).toBe(true);
    expect(p.repoUrl).toBeNull();
  });

  it("falls back to summary when tagline is empty, and Software when category missing", () => {
    const p = toProduct({ ...row, tagline: null, product_categories: null });
    expect(p.tagline).toBe("A keyboard-first project board.");
    expect(p.category).toBe("Software");
  });

  it("orders related chips by sort_order, drops null links, and caps at two", () => {
    const p = toProduct({
      ...row,
      product_blog_links: [
        { sort_order: 20, blog_posts: { slug: "two", title: "Two" } },
        { sort_order: 10, blog_posts: { slug: "one", title: "One" } },
        { sort_order: 5, blog_posts: null },
      ],
    });
    expect(p.related).toEqual([
      { slug: "one", title: "One" },
      { slug: "two", title: "Two" },
    ]);
  });
});

describe("toProductDetail", () => {
  it("splits description/technical into paragraphs", () => {
    const d = toProductDetail(row);
    expect(d.descriptionParagraphs).toEqual(["First para.", "Second para."]);
    expect(d.technicalParagraphs).toEqual(["Arch para."]);
  });

  it("orders features by sort_order and drops nothing", () => {
    const d = toProductDetail({
      ...row,
      product_features: [
        { id: "b", title: "B", description: null, image: null, sort_order: 20 },
        { id: "a", title: "A", description: "da", image: "ia", sort_order: 10 },
      ],
    });
    expect(d.features.map((f) => f.title)).toEqual(["A", "B"]);
  });

  it("orders related posts and filters draft posts (RLS returns them as null)", () => {
    const d = toProductDetail({
      ...row,
      product_blog_links: [
        { sort_order: 20, blog_posts: { slug: "two", title: "Two", excerpt: null, cover_image: null } },
        { sort_order: 10, blog_posts: { slug: "one", title: "One", excerpt: "e", cover_image: null } },
        { sort_order: 5, blog_posts: null },
      ],
    });
    expect(d.relatedPosts.map((p) => p.slug)).toEqual(["one", "two"]);
  });

  it("builds seoDescription fallback from tagline + summary", () => {
    const d = toProductDetail({ ...row, seo_description: null });
    expect(d.seoDescription).toBe(
      "Standups into shipped work. — A keyboard-first project board.",
    );
    expect(toProductDetail({ ...row, seo_description: "Custom." }).seoDescription).toBe("Custom.");
  });
});
