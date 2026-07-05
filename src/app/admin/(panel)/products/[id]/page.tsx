import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getProductFullAdmin,
  listCategoriesAdmin,
  listPostsForPicker,
} from "@/lib/admin-queries";
import { ProductEditor } from "@/components/admin/product-editor";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { deleteProduct } from "../actions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, posts] = await Promise.all([
    getProductFullAdmin(id),
    listCategoriesAdmin(),
    listPostsForPicker(),
  ]);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/products"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Products
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Edit {product.name}</h1>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
            product.status === "published"
              ? "bg-emerald-500/12 text-emerald-500 ring-emerald-500/20"
              : "bg-muted text-muted-foreground ring-border",
          )}
        >
          {product.status === "published" ? "Published" : "Draft"}
        </span>
      </div>

      <ProductEditor product={product} categories={categories} posts={posts} />

      <div className="border-border max-w-3xl border-t pt-6">
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={product.id} />
          <ConfirmSubmit
            message={`Delete "${product.name}"? This cannot be undone.`}
            className="border-destructive/30 text-destructive hover:bg-destructive/10 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          >
            Delete product
          </ConfirmSubmit>
        </form>
      </div>
    </div>
  );
}
