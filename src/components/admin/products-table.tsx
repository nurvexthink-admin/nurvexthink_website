"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Star } from "lucide-react";
import type { ProductCategoryRow } from "@/lib/supabase/types";
import type { AdminProductRow } from "@/lib/admin-queries";
import {
  deleteProduct,
  duplicateProduct,
  reorderProducts,
} from "@/app/admin/(panel)/products/actions";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { SortableList, SortableItem } from "@/components/admin/sortable-list";
import { fieldClass } from "@/components/admin/form-styles";
import { cn } from "@/lib/utils";

const REORDER_DISABLED_HINT = "Clear the filters to reorder — positions are global.";

function ProductRowItem({
  product: p,
  dragDisabled,
  onDuplicate,
  busy,
}: {
  product: AdminProductRow;
  dragDisabled: boolean;
  onDuplicate: (id: string) => void;
  busy: boolean;
}) {
  return (
    <SortableItem
      id={p.id}
      disabled={dragDisabled}
      handleTitle={dragDisabled ? REORDER_DISABLED_HINT : "Drag to reorder"}
      className="border-border bg-card items-center rounded-xl border p-3"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-muted relative aspect-[16/9] w-20 shrink-0 overflow-hidden rounded-md">
          {p.cover_image ? (
            <Image src={p.cover_image} alt="" fill sizes="5rem" className="object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {p.featured ? (
              <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />
            ) : null}
            <span className="text-foreground truncate text-sm font-medium">{p.name}</span>
          </div>
          <div className="text-muted-foreground truncate font-mono text-xs">/{p.slug}</div>
        </div>
        <span className="text-muted-foreground hidden w-28 truncate text-xs sm:inline">
          {p.product_categories?.name ?? "—"}
        </span>
        <span className="text-muted-foreground w-12 text-xs capitalize">{p.lifecycle}</span>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
            p.status === "published"
              ? "bg-emerald-500/12 text-emerald-500 ring-emerald-500/20"
              : "bg-muted text-muted-foreground ring-border",
          )}
        >
          {p.status === "published" ? "Published" : "Draft"}
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/products/${p.id}`}
            className="border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition-colors"
          >
            <Pencil className="size-3.5" />
            Edit
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDuplicate(p.id)}
            className="border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition-colors disabled:opacity-50"
          >
            <Copy className="size-3.5" />
            Duplicate
          </button>
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
      </div>
    </SortableItem>
  );
}

/**
 * Admin list (spec §3): featured group first (mirrors the public order — a drag
 * can never cross the featured boundary, because publicly it couldn't change
 * anything), status/category filters, drag reorder persisting sort_order,
 * disabled while any filter is active.
 */
export function ProductsTable({
  products,
  categories,
}: {
  products: AdminProductRow[];
  categories: ProductCategoryRow[];
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Optimistic row order; server order (featured DESC, sort_order ASC) seeds it.
  const [order, setOrder] = useState(() => products.map((p) => p.id));
  // Re-sync when the server sends a different row set (duplicate/delete/refresh).
  // Setting state during render is React's sanctioned derived-state pattern.
  const serverIds = products.map((p) => p.id).join("|");
  const [lastServerIds, setLastServerIds] = useState(serverIds);
  if (serverIds !== lastServerIds) {
    setLastServerIds(serverIds);
    setOrder(products.map((p) => p.id));
  }

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const ordered = order
    .map((id) => byId.get(id))
    .filter((p): p is AdminProductRow => Boolean(p));

  const filtersActive = statusFilter !== "all" || categoryFilter !== "all";
  const visible = ordered.filter(
    (p) =>
      (statusFilter === "all" || p.status === statusFilter) &&
      (categoryFilter === "all" || p.category_id === categoryFilter),
  );

  const featuredRows = visible.filter((p) => p.featured);
  const normalRows = visible.filter((p) => !p.featured);
  const dragDisabled = filtersActive || pending;

  function persist(nextGroupIds: string[], group: "featured" | "normal") {
    // Only reachable with filters off, so featured + normal cover every row.
    const featIds = group === "featured" ? nextGroupIds : featuredRows.map((p) => p.id);
    const normIds = group === "normal" ? nextGroupIds : normalRows.map((p) => p.id);
    const next = [...featIds, ...normIds];
    setOrder(next);
    setError(null);
    startTransition(async () => {
      const result = await reorderProducts(next);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  function duplicate(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await duplicateProduct(id);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3.5 py-2.5 text-sm">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className={cn(fieldClass, "w-auto")}
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className={cn(fieldClass, "w-auto")}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {filtersActive ? (
          <p className="text-muted-foreground text-xs" title={REORDER_DISABLED_HINT}>
            Reordering is off while filters are active — positions are global.
          </p>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="border-border bg-card text-muted-foreground rounded-2xl border p-8 text-sm">
          No products match these filters.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {featuredRows.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Featured — always first on the public grid
              </p>
              <SortableList
                ids={featuredRows.map((p) => p.id)}
                disabled={dragDisabled}
                onReorder={(ids) => persist(ids, "featured")}
              >
                <div className="flex flex-col gap-2">
                  {featuredRows.map((p) => (
                    <ProductRowItem
                      key={p.id}
                      product={p}
                      dragDisabled={dragDisabled}
                      onDuplicate={duplicate}
                      busy={pending}
                    />
                  ))}
                </div>
              </SortableList>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            {featuredRows.length > 0 ? (
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Everything else
              </p>
            ) : null}
            <SortableList
              ids={normalRows.map((p) => p.id)}
              disabled={dragDisabled}
              onReorder={(ids) => persist(ids, "normal")}
            >
              <div className="flex flex-col gap-2">
                {normalRows.map((p) => (
                  <ProductRowItem
                    key={p.id}
                    product={p}
                    dragDisabled={dragDisabled}
                    onDuplicate={duplicate}
                    busy={pending}
                  />
                ))}
              </div>
            </SortableList>
          </div>
        </div>
      )}
    </div>
  );
}
