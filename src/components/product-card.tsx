import Image from "next/image";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";
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
 *
 * Variants: "grid" (compact tile — home page) and "row" (one per line on
 * /products — cover on the left, info on the right).
 */
export function ProductCard({
  product,
  onOpen,
  variant = "grid",
}: {
  product: Product;
  onOpen?: (slug: string) => void;
  variant?: "grid" | "row";
}) {
  const interceptedClick = onOpen
    ? (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        onOpen(product.slug);
      }
    : undefined;

  const cover = product.coverImage ? (
    <Image
      src={product.coverImage}
      alt=""
      fill
      sizes={
        variant === "row"
          ? "(min-width: 640px) 24rem, 92vw"
          : "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
      }
      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
    />
  ) : (
    <div
      aria-hidden
      className="from-brand-navy/40 to-brand-indigo/15 absolute inset-0 bg-gradient-to-br"
    />
  );

  const featuredBadge = product.featured ? (
    <span className="bg-background/80 text-primary absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur">
      <Sparkles className="size-3" />
      Featured
    </span>
  ) : null;

  const metaRow = (
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
  );

  if (variant === "row") {
    return (
      <a
        href={`/products/${product.slug}`}
        onClick={interceptedClick}
        className="group border-border bg-card hover:border-primary/40 relative flex flex-col overflow-hidden rounded-2xl border transition-colors sm:flex-row"
      >
        <div className="bg-muted relative aspect-[16/10] w-full shrink-0 overflow-hidden sm:aspect-auto sm:w-80 sm:self-stretch lg:w-96">
          {cover}
          {featuredBadge}
        </div>

        <div className="flex min-h-56 flex-1 flex-col justify-center gap-3.5 p-6 sm:p-8">
          {metaRow}
          <div className="flex flex-col gap-1.5">
            <h3 className="font-heading flex items-center gap-2 text-2xl font-semibold tracking-tight">
              {product.name}
              <ArrowUpRight className="text-muted-foreground group-hover:text-primary size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </h3>
            <p className="text-muted-foreground text-pretty">{product.tagline}</p>
          </div>
          {product.highlights.length > 0 ? (
            <ul className="mt-1 flex flex-col gap-1.5">
              {product.highlights.slice(0, 2).map((h) => (
                <li key={h} className="text-muted-foreground flex items-start gap-2 text-sm">
                  <span className="bg-primary/10 text-primary mt-0.5 inline-flex size-4.5 shrink-0 items-center justify-center rounded-full">
                    <Check className="size-2.5" />
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </a>
    );
  }

  return (
    <a
      href={`/products/${product.slug}`}
      onClick={interceptedClick}
      className="group border-border bg-card hover:border-primary/40 relative flex flex-col overflow-hidden rounded-2xl border transition-colors"
    >
      <div className="bg-muted relative aspect-[16/9] w-full overflow-hidden">
        {cover}
        {featuredBadge}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        {metaRow}
        <div className="flex flex-col gap-1.5">
          <h3 className="font-heading text-xl font-semibold tracking-tight">{product.name}</h3>
          <p className="text-muted-foreground text-sm">{product.tagline}</p>
        </div>
      </div>
    </a>
  );
}
