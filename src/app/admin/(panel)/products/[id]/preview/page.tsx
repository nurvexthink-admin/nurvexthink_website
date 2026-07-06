import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProductFullAdmin } from "@/lib/admin-queries";
import { toProductDetail } from "@/lib/queries";
import { ProductDetailView } from "@/components/product-detail-view";
import { PreviewQuickView } from "@/components/admin/preview-quick-view";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Admin-only preview (spec §3): the ACTUAL public components rendered from the
 * last-saved draft — admin client fetch, then the same toProductDetail mapping
 * the public routes use. Inside the guarded (panel) layout. Draft related
 * posts are filtered out exactly like anon RLS does publicly, so the preview
 * never shows a chip the public page would hide.
 */
export default async function ProductPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tier?: string }>;
}) {
  const { id } = await params;
  const { tier } = await searchParams;
  const row = await getProductFullAdmin(id);
  if (!row) notFound();

  const detail = toProductDetail({
    ...row,
    product_blog_links: row.product_blog_links.filter(
      (l) => l.blog_posts?.status === "published",
    ),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border bg-card/60 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/products/${id}`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to editor
          </Link>
          <span className="text-muted-foreground">
            Previewing the last saved {row.status === "published" ? "version" : "draft"}. Links
            inside the preview go to the public site and only work once published.
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/products/${id}/preview`}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tier !== "quick"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Technical page
          </Link>
          <Link
            href={`/admin/products/${id}/preview?tier=quick`}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tier === "quick"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Quick View
          </Link>
        </div>
      </div>

      {tier === "quick" ? (
        <PreviewQuickView product={detail} />
      ) : (
        <div className="border-border overflow-hidden rounded-2xl border">
          <ProductDetailView detail={detail} />
        </div>
      )}
    </div>
  );
}
