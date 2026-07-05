import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProductEditor } from "@/components/admin/product-editor";
import type { AdminProductFull } from "@/lib/admin-queries";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, back: vi.fn() }),
}));

const saveProductFull = vi.hoisted(() => vi.fn());
vi.mock("@/app/admin/(panel)/products/actions", () => ({
  saveProductFull,
  uploadProductImage: vi.fn(),
}));

const categories = [
  {
    id: "c1",
    name: "Productivity",
    slug: "productivity",
    sort_order: 10,
    created_at: "2026-06-01T00:00:00Z",
  },
];

function publishedProduct(): AdminProductFull {
  return {
    id: "p1",
    slug: "fluxboard",
    name: "FluxBoard",
    tagline: "Standups into shipped work.",
    summary: "A keyboard-first project board.",
    highlights: ["Fast", "Realtime", "Keyboard-first"],
    description: null,
    technical_details: null,
    cover_image: "https://cdn.example/cover.png",
    gallery: [],
    category_id: "c1",
    tech: [],
    lifecycle: "live",
    year: null,
    live_url: null,
    repo_url: null,
    featured: false,
    sort_order: 10,
    status: "published",
    seo_description: null,
    og_image: null,
    published_at: "2026-07-01T00:00:00Z",
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    product_categories: { name: "Productivity" },
    product_features: [],
    product_blog_links: [],
  };
}

beforeEach(() => {
  saveProductFull.mockReset();
  push.mockReset();
});

describe("ProductEditor", () => {
  it("shows the four tier tabs", () => {
    render(<ProductEditor product={null} categories={categories} posts={[]} />);
    for (const label of ["Quick View", "Features", "Technical", "SEO & Links"]) {
      expect(screen.getByRole("tab", { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it("auto-fills the slug from the name until the slug is edited", () => {
    render(<ProductEditor product={null} categories={categories} posts={[]} />);
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Flux Board 2" } });
    const slug = screen.getByLabelText(/^Slug/) as HTMLInputElement;
    expect(slug.value).toBe("flux-board-2");
    fireEvent.change(slug, { target: { value: "custom" } });
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "Renamed" } });
    expect((screen.getByLabelText(/^Slug/) as HTMLInputElement).value).toBe("custom");
  });

  it("disables Publish and lists what's missing for an incomplete quick view", () => {
    render(<ProductEditor product={null} categories={categories} posts={[]} />);
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
    expect(screen.getByText(/At least 3 highlights/)).toBeInTheDocument();
  });

  it("offers 'Unpublish & save as draft' when saving a published product fails validation", async () => {
    saveProductFull.mockResolvedValue({ ok: false, missing: ["Cover image"], error: null });
    render(<ProductEditor product={publishedProduct()} categories={categories} posts={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Unpublish & save as draft instead/ }),
      ).toBeInTheDocument(),
    );
  });
});
