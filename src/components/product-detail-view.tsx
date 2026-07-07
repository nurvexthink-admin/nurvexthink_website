import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import type { ProductDetail } from "@/lib/content";
import { productCta } from "@/lib/product-cta";
import { isSafeHttpUrl } from "@/lib/product-admin";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Tier 2: the technical page body. Pure so PR 3's admin preview can reuse it. */
export function ProductDetailView({ detail }: { detail: ProductDetail }) {
  const cta = productCta(detail);

  return (
    <section className="py-16 sm:py-24">
      <Container className="flex max-w-4xl flex-col gap-12">
        <div className="flex flex-col gap-8">
          <Link
            href="/products"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="size-4" />
            All products
          </Link>

          {/* Overview strip — same story as the Quick View. */}
          <div className="flex flex-col gap-4">
            <div className="text-muted-foreground flex items-center gap-3 font-mono text-xs tracking-[0.18em] uppercase">
              <span className="text-primary">{detail.category}</span>
              <span aria-hidden>·</span>
              <span>{detail.status}</span>
              {detail.year ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{detail.year}</span>
                </>
              ) : null}
            </div>
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              {detail.name}
            </h1>
            <p className="text-muted-foreground text-lg text-pretty">{detail.tagline}</p>
          </div>

          {detail.coverImage ? (
            <div className="bg-muted relative aspect-[16/9] overflow-hidden rounded-2xl">
              <Image
                src={detail.coverImage}
                alt={`${detail.name} cover`}
                fill
                priority
                sizes="(min-width: 1024px) 56rem, 92vw"
                className="object-cover"
              />
            </div>
          ) : null}

          {detail.highlights.length > 0 ? (
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {detail.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm">
                  <span className="bg-primary/10 text-primary mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full">
                    <Check className="size-3" />
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            {cta.kind === "live" ? (
              <a
                href={cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ size: "lg" }), "group")}
              >
                Open live app
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ) : (
              <span className={cn(buttonVariants({ size: "lg" }), "pointer-events-none opacity-60")}>
                Coming soon
              </span>
            )}
            {detail.repoUrl && isSafeHttpUrl(detail.repoUrl) ? (
              <a
                href={detail.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                View repo
              </a>
            ) : null}
          </div>
        </div>

        {/* Feature showcase — alternating image/text rows; hidden when empty. */}
        {detail.features.length > 0 ? (
          <div className="flex flex-col gap-6">
            <h2 className="font-heading text-2xl font-bold tracking-tight">Features</h2>
            <div className="flex flex-col gap-6">
              {detail.features.map((feature, i) => (
                <div
                  key={feature.title}
                  className={cn(
                    "border-border bg-card grid gap-6 overflow-hidden rounded-2xl border sm:grid-cols-2",
                    i % 2 === 1 && "sm:[&>*:first-child]:order-2",
                  )}
                >
                  <div className="bg-muted relative min-h-48">
                    {feature.image ? (
                      <Image
                        src={feature.image}
                        alt={`${feature.title} illustration`}
                        fill
                        sizes="(min-width: 640px) 28rem, 92vw"
                        className="object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden
                        className="from-brand-navy/30 to-brand-indigo/10 absolute inset-0 bg-gradient-to-br"
                      />
                    )}
                  </div>
                  <div className="flex flex-col justify-center gap-2 p-6 sm:p-8">
                    <h3 className="font-heading text-lg font-semibold tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Technical body. */}
        <div className="flex flex-col gap-6">
          {detail.descriptionParagraphs.length > 0 ? (
            <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6 sm:p-8">
              {detail.descriptionParagraphs.map((p) => (
                <p key={p.slice(0, 40)} className="text-foreground/90 text-base leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          ) : null}

          {detail.technicalParagraphs.length > 0 ? (
            <div className="flex flex-col gap-4">
              <h2 className="font-heading text-2xl font-bold tracking-tight">Technical details</h2>
              <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6 sm:p-8">
                {detail.technicalParagraphs.map((p) => (
                  <p key={p.slice(0, 40)} className="text-foreground/90 text-base leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          {detail.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {detail.tags.map((tag) => (
                <span
                  key={tag}
                  className="border-border bg-muted text-muted-foreground rounded-md border px-2.5 py-1 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {detail.gallery.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {detail.gallery.map((src) => (
                <div key={src} className="bg-muted relative aspect-[16/10] overflow-hidden rounded-xl">
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 28rem, 92vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Related posts — hidden when none. */}
        {detail.relatedPosts.length > 0 ? (
          <div className="flex flex-col gap-6">
            <h2 className="font-heading text-2xl font-bold tracking-tight">Related writing</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {detail.relatedPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group border-border bg-card hover:border-primary/40 flex flex-col gap-2 rounded-2xl border p-6 transition-colors"
                >
                  <h3 className="font-heading flex items-center gap-1.5 text-lg font-semibold tracking-tight">
                    {post.title}
                    <ArrowRight className="text-muted-foreground group-hover:text-primary size-4 transition-transform group-hover:translate-x-0.5" />
                  </h3>
                  <p className="text-muted-foreground line-clamp-2 text-sm">{post.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {/* Order handoff. */}
        <div className="border-border bg-card flex flex-col items-start justify-between gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Want something like {detail.name}?
            </h2>
            <p className="text-muted-foreground text-sm">
              We build custom software on demand — tell us what you need.
            </p>
          </div>
          <Link
            href={`/order?ref=${detail.slug}`}
            className={cn(buttonVariants({ size: "lg" }), "group shrink-0")}
          >
            Request something like this
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
