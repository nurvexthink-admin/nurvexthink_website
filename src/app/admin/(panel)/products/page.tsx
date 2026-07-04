import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { listProductsAdmin } from "@/lib/admin-queries";
import { deleteProduct, toggleProductPublished } from "./actions";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listProductsAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm">{products.length} in the catalog</p>
        </div>
        <Link href="/admin/products/new" className={cn(buttonVariants(), "gap-1.5")}>
          <Plus className="size-4" />
          New product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="border-border bg-card text-muted-foreground rounded-2xl border p-8 text-sm">
          No products yet. Create your first one.
        </p>
      ) : (
        <div className="border-border overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="border-border bg-card/40 text-muted-foreground border-b text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Visibility</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {products.map((p) => (
                <tr key={p.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="text-foreground font-medium">{p.name}</div>
                    <div className="text-muted-foreground font-mono text-xs">
                      /{p.slug}
                    </div>
                  </td>
                  <td className="text-muted-foreground px-4 py-3 capitalize">{p.lifecycle}</td>
                  <td className="px-4 py-3">
                    <form action={toggleProductPublished}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="current" value={String(p.status === "published")} />
                      <button
                        type="submit"
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 transition-colors ring-inset",
                          p.status === "published"
                            ? "bg-emerald-500/12 text-emerald-500 ring-emerald-500/20"
                            : "bg-muted text-muted-foreground ring-border",
                        )}
                      >
                        {p.status === "published" ? "Published" : "Hidden"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition-colors"
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Link>
                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmSubmit
                          message={`Delete "${p.name}"? This cannot be undone.`}
                          className="border-destructive/30 text-destructive hover:bg-destructive/10 rounded-md border px-2.5 py-1 text-xs transition-colors"
                        >
                          Delete
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
