"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import type { ProductCategoryRow } from "@/lib/supabase/types";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  reorderCategories,
  type CategoryActionResult,
} from "@/app/admin/(panel)/products/categories/actions";
import { SortableList, SortableItem } from "@/components/admin/sortable-list";
import { fieldClass } from "@/components/admin/form-styles";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CategoryWithCount = ProductCategoryRow & { productCount: number };

export function CategoriesManager({ categories }: { categories: CategoryWithCount[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [pending, startTransition] = useTransition();

  // Optimistic order + rename drafts, re-synced when server data changes
  // (same derived-state pattern as ProductsTable).
  const serverKey = categories.map((c) => `${c.id}:${c.name}`).join("|");
  const [lastServerKey, setLastServerKey] = useState(serverKey);
  const [order, setOrder] = useState(() => categories.map((c) => c.id));
  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(categories.map((c) => [c.id, c.name])),
  );
  if (serverKey !== lastServerKey) {
    setLastServerKey(serverKey);
    setOrder(categories.map((c) => c.id));
    setNames(Object.fromEntries(categories.map((c) => [c.id, c.name])));
  }

  const byId = new Map(categories.map((c) => [c.id, c]));
  const ordered = order
    .map((id) => byId.get(id))
    .filter((c): c is CategoryWithCount => Boolean(c));

  function run(action: () => Promise<CategoryActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      {error ? (
        <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3.5 py-2.5 text-sm">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const name = newName.trim();
          if (!name) return;
          setNewName("");
          run(() => createCategory(name));
        }}
        className="flex items-center gap-2"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          aria-label="New category name"
          className={fieldClass}
        />
        <button type="submit" disabled={pending} className={cn(buttonVariants(), "shrink-0 gap-1.5")}>
          <Plus className="size-4" />
          Add
        </button>
      </form>

      {ordered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No categories yet.</p>
      ) : (
        <SortableList
          ids={ordered.map((c) => c.id)}
          disabled={pending}
          onReorder={(ids) => {
            setOrder(ids);
            run(() => reorderCategories(ids));
          }}
        >
          <div className="flex flex-col gap-2">
            {ordered.map((c) => {
              const draft = names[c.id] ?? c.name;
              const dirty = draft.trim() !== c.name && draft.trim() !== "";
              return (
                <SortableItem
                  key={c.id}
                  id={c.id}
                  disabled={pending}
                  className="border-border bg-card items-center rounded-xl border p-3"
                >
                  <div className="flex items-center gap-3">
                    <input
                      value={draft}
                      onChange={(e) => setNames({ ...names, [c.id]: e.target.value })}
                      aria-label={`Rename ${c.name}`}
                      className={fieldClass}
                    />
                    {dirty ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => renameCategory(c.id, draft))}
                        className="border-border text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
                      >
                        <Check className="size-3.5" />
                        Save
                      </button>
                    ) : null}
                    <span className="text-muted-foreground w-20 shrink-0 text-right text-xs">
                      {c.productCount} product{c.productCount === 1 ? "" : "s"}
                    </span>
                    <button
                      type="button"
                      disabled={pending || c.productCount > 0}
                      title={
                        c.productCount > 0
                          ? "In use — reassign its products in the editor first."
                          : "Delete category"
                      }
                      onClick={() => {
                        if (window.confirm(`Delete "${c.name}"?`)) run(() => deleteCategory(c.id));
                      }}
                      className="text-muted-foreground hover:text-destructive shrink-0 p-1.5 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </SortableItem>
              );
            })}
          </div>
        </SortableList>
      )}
    </div>
  );
}
