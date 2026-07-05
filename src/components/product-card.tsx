import Image from "next/image";
import { Sparkles } from "lucide-react";
import type { Product } from "@/lib/content";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<Product["status"], string> = {
  Live: "bg-emerald-500/12 text-emerald-500 ring-emerald-500/20",
  Beta: "bg-amber-500/12 text-amber-500 ring-amber-500/20",
  Soon: "bg-muted text-muted-foreground ring-border",
};

/**
 * A real link to the technical page; when `onOpen` is provided the click is
 * intercepted to open the Quick View instead (crawlers/no-JS still navigate).
 */
export function ProductCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen?: (slug: string) => void;
}) {
  return (
    <a
      href={`/products/${product.slug}`}
      onClick={
        onOpen
          ? (e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              onOpen(product.slug);
            }
          : undefined
      }
      className="group border-border bg-card hover:border-primary/40 relative flex flex-col overflow-hidden rounded-2xl border transition-colors"
    >
      <div className="bg-muted relative aspect-[16/9] w-full overflow-hidden">
        {product.coverImage ? (
          <Image
            src={product.coverImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            aria-hidden
            className="from-brand-navy/40 to-brand-indigo/15 absolute inset-0 bg-gradient-to-br"
          />
        )}
        {product.featured ? (
          <span className="bg-background/80 text-primary absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur">
            <Sparkles className="size-3" />
            Featured
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
            {product.category}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
              STATUS_STYLES[product.status],
            )}
          >
            {product.status}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="font-heading text-xl font-semibold tracking-tight">{product.name}</h3>
          <p className="text-muted-foreground text-sm">{product.tagline}</p>
        </div>
      </div>
    </a>
  );
}
