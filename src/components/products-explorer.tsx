"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/content";
import { ProductCard } from "@/components/product-card";
import { ProductQuickView } from "@/components/product-quick-view";
import { cn } from "@/lib/utils";

/**
 * Client island for /products: category pills + grid + Quick View.
 * URL sync is pushState-only (spec §2): no router.push, no RSC refetch.
 * Initial open state hydrates from ?p=; unknown slugs are silently ignored.
 */
export function ProductsExplorer({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<string>("All");

  const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);

  // Hydrate from ?p=, re-syncing whenever Next's searchParams identity changes
  // (e.g. client navigation into this route with a ?p= query already set).
  // Adjusted during render (not an effect) to avoid an extra render pass —
  // see https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  const fromUrl = searchParams.get("p");
  const hydratedSlug = fromUrl && bySlug.has(fromUrl) ? fromUrl : null;
  const [openSlug, setOpenSlug] = useState<string | null>(hydratedSlug);
  const [lastHydratedSlug, setLastHydratedSlug] = useState(hydratedSlug);
  if (hydratedSlug !== lastHydratedSlug) {
    setLastHydratedSlug(hydratedSlug);
    setOpenSlug(hydratedSlug);
  }

  // Follow browser Back/Forward navigation (raw pushState, not Next's router).
  useEffect(() => {
    const onPop = () => {
      const p = new URLSearchParams(window.location.search).get("p");
      setOpenSlug(p && bySlug.has(p) ? p : null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [bySlug]);

  const openQuickView = useCallback((slug: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("p", slug);
    window.history.pushState(null, "", url);
    setOpenSlug(slug);
  }, []);

  const closeQuickView = useCallback(() => {
    setOpenSlug(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has("p")) {
      url.searchParams.delete("p");
      window.history.pushState(null, "", url);
    }
  }, []);

  const categories = useMemo(() => {
    const names = Array.from(new Set(products.map((p) => p.category)));
    return ["All", ...names];
  }, [products]);

  const visible =
    filter === "All" ? products : products.filter((p) => p.category === filter);

  return (
    <div className="flex flex-col gap-8">
      {categories.length > 2 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              aria-pressed={filter === c}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                filter === c
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="text-muted-foreground">Nothing in this category yet.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {visible.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              onOpen={openQuickView}
              variant="row"
            />
          ))}
        </div>
      )}

      <ProductQuickView
        product={openSlug ? (bySlug.get(openSlug) ?? null) : null}
        open={openSlug !== null}
        onClose={closeQuickView}
      />
    </div>
  );
}
