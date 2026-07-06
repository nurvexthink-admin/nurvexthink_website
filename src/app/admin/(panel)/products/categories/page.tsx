import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listCategoriesAdmin, countProductsByCategory } from "@/lib/admin-queries";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [categories, counts] = await Promise.all([
    listCategoriesAdmin(),
    countProductsByCategory(),
  ]);
  const rows = categories.map((c) => ({ ...c, productCount: counts[c.id] ?? 0 }));

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/products"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Products
      </Link>
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Product categories</h1>
        <p className="text-muted-foreground text-sm">
          This order is the filter-pill order on /products. Categories in use can’t be deleted —
          reassign their products first.
        </p>
      </div>
      <CategoriesManager categories={rows} />
    </div>
  );
}
