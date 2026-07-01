import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProductAdmin } from "@/lib/admin-queries";
import { ProductForm } from "@/components/admin/product-form";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { deleteProduct, updateProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductAdmin(id);
  if (!product) notFound();

  const action = updateProduct.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/products"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Products
      </Link>
      <h1 className="font-heading text-2xl font-bold tracking-tight">Edit {product.name}</h1>

      <ProductForm product={product} action={action} submitLabel="Save changes" />

      <div className="border-border max-w-2xl border-t pt-6">
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
