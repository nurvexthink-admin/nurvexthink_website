import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/product-detail-view";
import { getProductDetailBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getProductDetailBySlug(slug);
  if (!detail) return { title: "Product not found" };
  return {
    title: detail.name,
    description: detail.seoDescription,
    alternates: { canonical: `/products/${detail.slug}` },
    openGraph: {
      title: `${detail.name} — NurvexThink`,
      description: detail.seoDescription,
      ...(detail.ogImage ? { images: [{ url: detail.ogImage }] } : {}),
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getProductDetailBySlug(slug);
  if (!detail) notFound();
  return <ProductDetailView detail={detail} />;
}
