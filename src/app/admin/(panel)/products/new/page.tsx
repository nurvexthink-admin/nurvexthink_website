import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductEditor } from "@/components/admin/product-editor";
import { listCategoriesAdmin, listPostsForPicker } from "@/lib/admin-queries";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, posts] = await Promise.all([listCategoriesAdmin(), listPostsForPicker()]);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/products"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Products
      </Link>
      <h1 className="font-heading text-2xl font-bold tracking-tight">New product</h1>
      <ProductEditor product={null} categories={categories} posts={posts} />
    </div>
  );
}
