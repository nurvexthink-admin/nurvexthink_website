"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import type { Product } from "@/lib/content";
import { productCta } from "@/lib/product-cta";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Tier 1: the approachable box. A native <dialog> — free focus trap + Esc.
 * The parent owns open state and URL sync; Esc surfaces as the dialog's
 * `close` event, backdrop clicks hit the <dialog> element itself.
 */
export function ProductQuickView({
  product,
  open,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!product) return null;
  const cta = productCta(product);

  return (
    <dialog
      ref={ref}
      aria-label={product.name}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // backdrop
      }}
      className="bg-card text-foreground border-border m-auto w-[min(92vw,34rem)] rounded-2xl border p-0 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col">
        <div className="bg-muted relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
          {product.coverImage ? (
            <Image src={product.coverImage} alt="" fill sizes="34rem" className="object-cover" />
          ) : (
            <div
              aria-hidden
              className="from-brand-navy/40 to-brand-indigo/15 absolute inset-0 bg-gradient-to-br"
            />
          )}
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div className="text-muted-foreground flex items-center gap-3 font-mono text-xs tracking-[0.18em] uppercase">
            <span className="text-primary">{product.category}</span>
            <span aria-hidden>·</span>
            <span>{product.status}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="font-heading text-2xl font-bold tracking-tight">{product.name}</h2>
            <p className="text-muted-foreground text-pretty">{product.tagline}</p>
          </div>

          {product.highlights.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {product.highlights.slice(0, 6).map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm">
                  <span className="bg-primary/10 text-primary mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full">
                    <Check className="size-3" />
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">{product.summary}</p>
          )}

          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
            {cta.kind === "live" ? (
              <a
                href={cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants(), "group")}
              >
                Open live app
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ) : (
              <span className={cn(buttonVariants(), "pointer-events-none opacity-60")}>
                Coming soon
              </span>
            )}
            <Link
              href={`/products/${product.slug}`}
              className={cn(buttonVariants({ variant: "outline" }), "group")}
            >
              Full technical details
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </dialog>
  );
}
