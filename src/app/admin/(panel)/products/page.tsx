import Link from "next/link";
import { Plus, Tags } from "lucide-react";
import { listProductsAdmin, listCategoriesAdmin } from "@/lib/admin-queries";
import { ProductsTable } from "@/components/admin/products-table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([listProductsAdmin(), listCategoriesAdmin()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm">
            {products.length} in the catalog — drag rows to set the public order
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/categories"
            className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}
          >
            <Tags className="size-4" />
            Categories
          </Link>
          <Link href="/admin/products/new" className={cn(buttonVariants(), "gap-1.5")}>
            <Plus className="size-4" />
            New product
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="border-border bg-card text-muted-foreground rounded-2xl border p-8 text-sm">
          No products yet. Create your first one.
        </p>
      ) : (
        <ProductsTable products={products} categories={categories} />
      )}
    </div>
  );
}
