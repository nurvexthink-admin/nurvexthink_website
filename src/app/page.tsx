import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Eyebrow, SectionHeading } from "@/components/section-heading";
import { ServiceIcon } from "@/components/icon";
import { ProductCard } from "@/components/product-card";
import { BlogCard } from "@/components/blog-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { processSteps, services, stats } from "@/lib/content";
import { getPosts, getProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, posts] = await Promise.all([getProducts(), getPosts()]);
  const featured = products.slice(0, 6);
  const recentPosts = posts.slice(0, 3);

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden">
        {/* Grid comes from the site-wide ambient background; keep a focal glow. */}
        <div aria-hidden className="bg-glow absolute inset-x-0 top-0 h-180" />
        {/* The hero visual is the site-wide 3D logo watermark turning behind this copy. */}
        <Container className="relative flex min-h-[88vh] flex-col items-center justify-center gap-8 py-16 text-center">
          <div className="flex flex-col items-center gap-5">
            <Eyebrow>Software studio</Eyebrow>
            <h1 className="text-gradient font-heading text-5xl font-bold tracking-tight text-balance sm:text-7xl">
              Software, built and published.
            </h1>
            <p className="text-muted-foreground max-w-md text-lg text-pretty">
              Products we build and run — and custom software on demand.
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Link href="/products" className={cn(buttonVariants({ size: "lg" }), "group")}>
                Explore products
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/order" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Start a project
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ---------------- Stats ---------------- */}
      <section className="border-border bg-card/40 border-y">
        <Container className="grid grid-cols-2 gap-px overflow-hidden md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1 px-2 py-8 text-center">
              <span className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                {s.value}
              </span>
              <span className="text-muted-foreground text-sm">{s.label}</span>
            </div>
          ))}
        </Container>
      </section>

      {/* ---------------- Services ---------------- */}
      <section className="py-20 sm:py-28">
        <Container className="flex flex-col gap-12">
          <SectionHeading
            eyebrow="What we do"
            title="From idea to shipped"
            description="Strategy, design, engineering, launch."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6"
              >
                <span className="bg-primary/10 text-primary inline-flex size-11 items-center justify-center rounded-xl">
                  <ServiceIcon name={service.icon} className="size-5" />
                </span>
                <h3 className="font-heading text-lg font-semibold tracking-tight">
                  {service.title}
                </h3>
                <p className="text-muted-foreground text-sm">{service.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------- Featured products ---------------- */}
      {featured.length > 0 ? (
        <section className="border-border border-t py-20 sm:py-28">
          <Container className="flex flex-col gap-12">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <SectionHeading
                align="left"
                eyebrow="Catalog"
                title="Products we've shipped"
                description="Software we build and run."
                className="max-w-xl"
              />
              <Link
                href="/products"
                className="group text-primary inline-flex items-center gap-1.5 text-sm font-medium"
              >
                View all products
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* ---------------- Process ---------------- */}
      <section className="border-border border-t py-20 sm:py-28">
        <Container className="flex flex-col gap-12">
          <SectionHeading
            eyebrow="How we work"
            title="Three steps, no black box"
            description="See the work as it happens."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {processSteps.map((step) => (
              <div
                key={step.step}
                className="border-border bg-card relative flex flex-col gap-3 rounded-2xl border p-7"
              >
                <span className="text-primary font-mono text-sm font-medium">{step.step}</span>
                <h3 className="font-heading text-xl font-semibold tracking-tight">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------- Blog preview ---------------- */}
      {recentPosts.length > 0 ? (
        <section className="border-border border-t py-20 sm:py-28">
          <Container className="flex flex-col gap-12">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <SectionHeading
                align="left"
                eyebrow="Writing"
                title="From the studio"
                description="Notes on how we build, design, and ship."
                className="max-w-xl"
              />
              <Link
                href="/blog"
                className="group text-primary inline-flex items-center gap-1.5 text-sm font-medium"
              >
                Read the blog
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {recentPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* ---------------- CTA ---------------- */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="border-border bg-card relative overflow-hidden rounded-3xl border px-6 py-16 text-center sm:px-12">
            <div aria-hidden className="bg-glow absolute inset-x-0 top-0 h-64" />
            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Have something to build?
              </h2>
              <p className="text-muted-foreground sm:text-lg">
                Tell us the problem. We&apos;ll come back with a plan, a timeline, and a preview
                link you can watch take shape.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/order" className={cn(buttonVariants({ size: "lg" }), "group")}>
                  Start a project
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/contact"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  Talk to us
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
