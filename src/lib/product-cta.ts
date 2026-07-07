import type { Product } from "@/lib/content";
import { isSafeHttpUrl } from "@/lib/product-admin";

export type ProductCta = { kind: "live"; href: string } | { kind: "soon" };

/** Spec §2 CTA rules. The seed's placeholder '#' counts as no URL, and any
 *  non-http(s) link (e.g. javascript:) is treated as no URL — never rendered. */
export function productCta(p: Pick<Product, "status" | "liveUrl">): ProductCta {
  const hasUrl = Boolean(p.liveUrl) && p.liveUrl !== "#" && isSafeHttpUrl(p.liveUrl);
  if (p.status === "Soon" || !hasUrl) return { kind: "soon" };
  return { kind: "live", href: p.liveUrl };
}
