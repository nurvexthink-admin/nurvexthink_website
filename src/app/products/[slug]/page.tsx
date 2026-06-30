import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getProductBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return { title: product.name, description: product.summary };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <section className="py-16 sm:py-24">
      <Container className="flex max-w-3xl flex-col gap-8">
        <Link
          href="/products"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          All products
        </Link>

        <div className="flex flex-col gap-4">
          <div className="text-muted-foreground flex items-center gap-3 font-mono text-xs tracking-[0.18em] uppercase">
            <span className="text-primary">{product.category}</span>
            <span aria-hidden>·</span>
            <span>{product.status}</span>
            {product.year ? (
              <>
                <span aria-hidden>·</span>
                <span>{product.year}</span>
              </>
            ) : null}
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            {product.name}
          </h1>
          <p className="text-muted-foreground text-lg text-pretty">{product.summary}</p>
        </div>

        {product.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="border-border bg-muted text-muted-foreground rounded-md border px-2.5 py-1 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {product.description ? (
          <div className="border-border bg-card rounded-2xl border p-6 sm:p-8">
            <p className="text-foreground/90 text-base leading-relaxed">{product.description}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          {product.status === "Soon" || !product.liveUrl || product.liveUrl === "#" ? (
            <span className={cn(buttonVariants({ size: "lg" }), "pointer-events-none opacity-60")}>
              {product.status === "Soon" ? "Coming soon" : "Live link soon"}
            </span>
          ) : (
            <a
              href={product.liveUrl}
              className={cn(buttonVariants({ size: "lg" }), "group")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit {product.name}
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          )}
          <Link href="/order" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Build something like this
          </Link>
        </div>
      </Container>
    </section>
  );
}
