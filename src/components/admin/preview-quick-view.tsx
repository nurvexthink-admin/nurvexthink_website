"use client";

import { useRouter } from "next/navigation";
import type { Product } from "@/lib/content";
import { ProductQuickView } from "@/components/product-quick-view";

/**
 * Mounts the REAL tier-1 dialog open over the preview route. ProductQuickView
 * needs open/onClose (its parent normally owns URL sync) — here closing it
 * (Esc / backdrop / close event) steps back in history, i.e. to the tier-2
 * preview or the editor, wherever the admin came from.
 */
export function PreviewQuickView({ product }: { product: Product }) {
  const router = useRouter();
  return <ProductQuickView product={product} open onClose={() => router.back()} />;
}
