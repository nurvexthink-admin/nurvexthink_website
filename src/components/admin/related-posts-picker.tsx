"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { PostPickerItem } from "@/lib/admin-queries";
import { SortableList, SortableItem } from "@/components/admin/sortable-list";
import { fieldClass } from "@/components/admin/form-styles";

/**
 * Spec §3 SEO & Links tab: search posts by title, multi-select, drag-order.
 * Drafts are selectable but badged — anon RLS hides them publicly until the
 * post is published, so the link "activates" on publish with no extra work.
 */
export function RelatedPostsPicker({
  posts,
  selectedIds,
  onChange,
}: {
  posts: PostPickerItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(posts.map((p) => [p.id, p])), [posts]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(
      (p) => !selectedIds.includes(p.id) && (q === "" || p.title.toLowerCase().includes(q)),
    );
  }, [posts, query, selectedIds]);

  return (
    <div className="flex flex-col gap-3 text-sm font-medium">
      <span>
        Related blog posts{" "}
        <span className="text-muted-foreground font-normal">
          (chips in the quick view · “Related writing” cards on the technical page)
        </span>
      </span>

      {selectedIds.length > 0 ? (
        <SortableList ids={selectedIds} onReorder={onChange}>
          <div className="flex flex-col gap-2">
            {selectedIds.map((id) => {
              const post = byId.get(id);
              if (!post) return null;
              return (
                <SortableItem
                  key={id}
                  id={id}
                  className="border-border bg-card items-center rounded-lg border p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm">{post.title}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {post.status === "draft" ? (
                        <span className="bg-amber-500/12 rounded-full px-2 py-0.5 text-[11px] font-medium text-amber-500 ring-1 ring-amber-500/20 ring-inset">
                          Draft — won’t show until published
                        </span>
                      ) : null}
                      <button
                        type="button"
                        aria-label={`Remove ${post.title}`}
                        onClick={() => onChange(selectedIds.filter((s) => s !== id))}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  </div>
                </SortableItem>
              );
            })}
          </div>
        </SortableList>
      ) : (
        <p className="text-muted-foreground text-xs font-normal">No posts linked yet.</p>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search posts by title…"
        aria-label="Search posts by title"
        className={fieldClass}
      />
      <div className="border-border max-h-56 overflow-y-auto rounded-lg border">
        {results.length === 0 ? (
          <p className="text-muted-foreground p-3 text-xs font-normal">No matching posts.</p>
        ) : (
          results.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => onChange([...selectedIds, post.id])}
              className="hover:bg-muted flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-normal transition-colors"
            >
              <span className="truncate">{post.title}</span>
              {post.status === "draft" ? (
                <span className="text-muted-foreground shrink-0 text-[11px]">draft</span>
              ) : null}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
