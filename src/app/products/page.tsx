import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/section-heading";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products",
  description: "Software NurvexThink designs, builds, and ships — explore the catalog.",
};

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <>
      <section className="border-border relative overflow-hidden border-b">
        <div aria-hidden className="bg-grid mask-fade-y absolute inset-0" />
        <Container className="relative py-20 sm:py-24">
          <div className="flex max-w-2xl flex-col gap-5">
            <Eyebrow>Catalog</Eyebrow>
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">Products</h1>
            <p className="text-muted-foreground text-lg text-pretty">
              Software we build, run, and keep improving. Some are live today, others are on the way
              — each one shaped by what we learned shipping the last.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          {products.length === 0 ? (
            <p className="text-muted-foreground">No products published yet — check back soon.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
