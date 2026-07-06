"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Plus, X } from "lucide-react";
import type { ProductCategoryRow } from "@/lib/supabase/types";
import type { AdminProductFull, PostPickerItem } from "@/lib/admin-queries";
import {
  saveProductFull,
  type ProductPayload,
  type SaveIntent,
} from "@/app/admin/(panel)/products/actions";
import { validatePublishTier, slugify } from "@/lib/product-admin";
import { SortableList, SortableItem } from "@/components/admin/sortable-list";
import { ImageUploadField, GalleryUploadField } from "@/components/admin/image-upload";
import { RelatedPostsPicker } from "@/components/admin/related-posts-picker";
import { fieldClass, labelClass, hintClass } from "@/components/admin/form-styles";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Client-side rows need stable keys for drag-and-drop. */
type HighlightItem = { key: string; text: string };
type FeatureItem = { key: string; title: string; description: string; image: string | null };

type Tab = "quick" | "features" | "technical" | "seo";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "quick", label: "Quick View", hint: "the box everyone sees first" },
  { id: "features", label: "Features", hint: "the detail page’s showcase" },
  { id: "technical", label: "Technical", hint: "the detail page" },
  { id: "seo", label: "SEO & Links", hint: "search results & related posts" },
];

function newKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function ProductEditor({
  product,
  categories,
  posts,
}: {
  product: AdminProductFull | null;
  categories: ProductCategoryRow[];
  posts: PostPickerItem[];
}) {
  const router = useRouter();
  const isPublished = product?.status === "published";

  const [tab, setTab] = useState<Tab>("quick");
  const [busy, setBusy] = useState<SaveIntent | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  /** True after a blocked save on a published product — shows the escape hatch. */
  const [offerUnpublish, setOfferUnpublish] = useState(false);

  // ---- the form object (keyed lists for dnd) ----
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [tagline, setTagline] = useState(product?.tagline ?? "");
  const [summary, setSummary] = useState(product?.summary ?? "");
  const [highlights, setHighlights] = useState<HighlightItem[]>(
    (product?.highlights ?? []).map((text) => ({ key: newKey(), text })),
  );
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [coverImage, setCoverImage] = useState<string | null>(product?.cover_image ?? null);
  const [liveUrl, setLiveUrl] = useState(product?.live_url ?? "");
  const [lifecycle, setLifecycle] = useState<"live" | "beta" | "soon">(
    product?.lifecycle ?? "live",
  );
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [features, setFeatures] = useState<FeatureItem[]>(
    [...(product?.product_features ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((f) => ({
        key: newKey(),
        title: f.title,
        description: f.description ?? "",
        image: f.image,
      })),
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [technicalDetails, setTechnicalDetails] = useState(product?.technical_details ?? "");
  const [tech, setTech] = useState((product?.tech ?? []).join(", "));
  const [gallery, setGallery] = useState<string[]>(product?.gallery ?? []);
  const [repoUrl, setRepoUrl] = useState(product?.repo_url ?? "");
  const [year, setYear] = useState(product?.year ?? "");
  const [seoDescription, setSeoDescription] = useState(product?.seo_description ?? "");
  const [ogImage, setOgImage] = useState<string | null>(product?.og_image ?? null);
  const [relatedPostIds, setRelatedPostIds] = useState<string[]>(
    [...(product?.product_blog_links ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((l) => l.blog_post_id),
  );

  // Live quick-view completeness — drives the Publish button + inline checklist.
  const publishCheck = useMemo(
    () =>
      validatePublishTier({
        name,
        tagline,
        summary,
        highlights: highlights.map((h) => h.text),
        coverImage,
        categoryId: categoryId || null,
      }),
    [name, tagline, summary, highlights, coverImage, categoryId],
  );

  function buildPayload(): ProductPayload {
    return {
      slug,
      name,
      tagline,
      summary,
      highlights: highlights.map((h) => h.text),
      description,
      technicalDetails,
      coverImage,
      gallery,
      categoryId: categoryId || null,
      tech: tech.split(",").map((t) => t.trim()).filter(Boolean),
      lifecycle,
      year,
      liveUrl,
      repoUrl,
      seoDescription,
      ogImage,
      featured,
      features: features.map((f) => ({
        title: f.title,
        description: f.description,
        image: f.image,
      })),
      relatedPostIds,
    };
  }

  async function submit(intent: SaveIntent) {
    setBusy(intent);
    setMissing([]);
    setServerError(null);
    setOfferUnpublish(false);
    const result = await saveProductFull(product?.id ?? null, intent, buildPayload());
    if (!result.ok) {
      setMissing(result.missing);
      setServerError(result.error);
      if (result.missing.length > 0 && isPublished && intent === "save") setOfferUnpublish(true);
      setBusy(null);
      return;
    }
    if (product) {
      router.push("/admin/products");
    } else {
      // New product: land in its editor so Preview / Publish are one click away.
      router.push(`/admin/products/${result.id}`);
    }
    router.refresh();
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {/* Error banner — names the missing quick-view fields (spec §3). */}
      {missing.length > 0 || serverError ? (
        <div className="border-destructive/30 bg-destructive/10 text-destructive flex flex-col gap-2 rounded-lg border px-4 py-3 text-sm">
          {missing.length > 0 ? (
            <>
              <p className="font-medium">
                {isPublished
                  ? "A published product can’t be saved with an incomplete Quick View. Missing:"
                  : "The Quick View tab must be complete before publishing. Missing:"}
              </p>
              <ul className="list-inside list-disc">
                {missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
              {offerUnpublish ? (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void submit("unpublish")}
                  className="border-destructive/40 hover:bg-destructive/10 mt-1 w-fit rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  Unpublish & save as draft instead
                </button>
              ) : null}
            </>
          ) : null}
          {serverError ? <p>{serverError}</p> : null}
        </div>
      ) : null}

      {/* Tier tabs — mirror the public surfaces (spec §3). */}
      <div
        role="tablist"
        aria-label="Editor sections"
        className="border-border flex flex-wrap gap-1 border-b"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {t.label}
            <span className="text-muted-foreground ml-1.5 hidden text-xs font-normal sm:inline">
              — {t.hint}
            </span>
          </button>
        ))}
      </div>

      {/* ============ Tab 1: Quick View ============ */}
      {tab === "quick" ? (
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>
              Name <span className={hintClass}>(card & page title)</span>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              Slug <span className={hintClass}>(/products/… — auto from name, editable)</span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="lowercase-with-dashes"
                className={fieldClass}
              />
            </label>
          </div>

          <label className={labelClass}>
            Tagline <span className={hintClass}>(card + quick-view headline)</span>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className={labelClass}>
            Summary <span className={hintClass}>(quick-view intro)</span>
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className={fieldClass}
            />
          </label>

          <div className="flex flex-col gap-1.5 text-sm font-medium">
            <span>
              Highlights{" "}
              <span className={hintClass}>
                (quick-view benefit bullets — plain language, no jargon; 3–6)
              </span>
            </span>
            <SortableList
              ids={highlights.map((h) => h.key)}
              onReorder={(keys) =>
                setHighlights(
                  keys.flatMap((k) => highlights.filter((h) => h.key === k)),
                )
              }
            >
              <div className="flex flex-col gap-2">
                {highlights.map((h) => (
                  <SortableItem key={h.key} id={h.key} className="items-center">
                    <div className="flex items-center gap-2">
                      <input
                        value={h.text}
                        onChange={(e) =>
                          setHighlights(
                            highlights.map((x) =>
                              x.key === h.key ? { ...x, text: e.target.value } : x,
                            ),
                          )
                        }
                        placeholder="One clear benefit"
                        aria-label="Highlight"
                        className={fieldClass}
                      />
                      <button
                        type="button"
                        aria-label="Remove highlight"
                        onClick={() => setHighlights(highlights.filter((x) => x.key !== h.key))}
                        className="text-muted-foreground hover:text-destructive p-1.5 transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </SortableItem>
                ))}
              </div>
            </SortableList>
            <button
              type="button"
              onClick={() => setHighlights([...highlights, { key: newKey(), text: "" }])}
              className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-xs font-medium transition-colors"
            >
              <Plus className="size-3.5" />
              Add highlight
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 text-sm font-medium">
              <span>
                Category <span className={hintClass}>(card pill + grid filter)</span>
              </span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                aria-label="Category"
                className={fieldClass}
              >
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Link
                href="/admin/products/categories"
                className="text-primary w-fit text-xs font-normal hover:underline"
              >
                Manage categories
              </Link>
            </div>
            <label className={labelClass}>
              Lifecycle <span className={hintClass}>(badge: Live / Beta / Soon)</span>
              <select
                value={lifecycle}
                onChange={(e) => setLifecycle(e.target.value as "live" | "beta" | "soon")}
                className={fieldClass}
              >
                <option value="live">Live</option>
                <option value="beta">Beta</option>
                <option value="soon">Soon</option>
              </select>
            </label>
          </div>

          <ImageUploadField
            label="Cover image"
            destination="card, quick view & page header"
            value={coverImage}
            onChange={setCoverImage}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>
              Live URL{" "}
              <span className={hintClass}>(“Open live app” button — empty = Coming soon)</span>
              <input
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm font-medium">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="size-4"
              />
              Featured <span className={hintClass}>(pinned first on the grid)</span>
            </label>
          </div>
        </div>
      ) : null}

      {/* ============ Tab 2: Features ============ */}
      {tab === "features" ? (
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Picture + explanation blocks on the technical page, in this order. Optional — the
            public section hides itself when there are none.
          </p>
          <SortableList
            ids={features.map((f) => f.key)}
            onReorder={(keys) => setFeatures(keys.flatMap((k) => features.filter((f) => f.key === k)))}
          >
            <div className="flex flex-col gap-4">
              {features.map((f) => (
                <SortableItem
                  key={f.key}
                  id={f.key}
                  className="border-border bg-card rounded-xl border p-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs font-medium uppercase">
                        Feature
                      </span>
                      <button
                        type="button"
                        aria-label="Remove feature"
                        onClick={() => setFeatures(features.filter((x) => x.key !== f.key))}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <label className={labelClass}>
                      Title <span className={hintClass}>(feature block heading)</span>
                      <input
                        value={f.title}
                        onChange={(e) =>
                          setFeatures(
                            features.map((x) =>
                              x.key === f.key ? { ...x, title: e.target.value } : x,
                            ),
                          )
                        }
                        className={fieldClass}
                      />
                    </label>
                    <label className={labelClass}>
                      Explanation <span className={hintClass}>(shown beside the picture)</span>
                      <textarea
                        rows={3}
                        value={f.description}
                        onChange={(e) =>
                          setFeatures(
                            features.map((x) =>
                              x.key === f.key ? { ...x, description: e.target.value } : x,
                            ),
                          )
                        }
                        className={cn(fieldClass, "resize-y")}
                      />
                    </label>
                    <ImageUploadField
                      label="Image"
                      destination="the picture in this block"
                      value={f.image}
                      onChange={(url) =>
                        setFeatures(
                          features.map((x) => (x.key === f.key ? { ...x, image: url } : x)),
                        )
                      }
                    />
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableList>
          <button
            type="button"
            onClick={() =>
              setFeatures([
                ...features,
                { key: newKey(), title: "", description: "", image: null },
              ])
            }
            className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-xs font-medium transition-colors"
          >
            <Plus className="size-3.5" />
            Add feature
          </button>
        </div>
      ) : null}

      {/* ============ Tab 3: Technical ============ */}
      {tab === "technical" ? (
        <div className="flex flex-col gap-5">
          <label className={labelClass}>
            Long description{" "}
            <span className={hintClass}>(technical page body — blank line between paragraphs)</span>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(fieldClass, "resize-y")}
            />
          </label>
          <label className={labelClass}>
            Technical details{" "}
            <span className={hintClass}>
              (“Technical details” section — architecture, stack decisions, notes)
            </span>
            <textarea
              rows={6}
              value={technicalDetails}
              onChange={(e) => setTechnicalDetails(e.target.value)}
              className={cn(fieldClass, "resize-y")}
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>
              Tech <span className={hintClass}>(chips on the technical page — comma separated)</span>
              <input
                value={tech}
                onChange={(e) => setTech(e.target.value)}
                placeholder="Next.js, Supabase"
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              Year <span className={hintClass}>(header meta line)</span>
              <input value={year} onChange={(e) => setYear(e.target.value)} className={fieldClass} />
            </label>
          </div>
          <GalleryUploadField value={gallery} onChange={setGallery} />
          <label className={labelClass}>
            Repo URL <span className={hintClass}>(“View repo” button — optional)</span>
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
      ) : null}

      {/* ============ Tab 4: SEO & Links ============ */}
      {tab === "seo" ? (
        <div className="flex flex-col gap-5">
          <label className={labelClass}>
            SEO description{" "}
            <span className={hintClass}>(search results — falls back to tagline + summary)</span>
            <textarea
              rows={3}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className={cn(fieldClass, "resize-y")}
            />
          </label>
          <ImageUploadField
            label="OG image"
            destination="social shares — falls back to the cover"
            value={ogImage}
            onChange={setOgImage}
          />
          <RelatedPostsPicker
            posts={posts}
            selectedIds={relatedPostIds}
            onChange={setRelatedPostIds}
          />
        </div>
      ) : null}

      {/* ============ Save row ============ */}
      <div className="border-border flex flex-wrap items-center gap-3 border-t pt-5">
        {isPublished ? (
          <>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void submit("save")}
              className={cn(buttonVariants({ size: "lg" }))}
            >
              {busy === "save" ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void submit("unpublish")}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              {busy === "unpublish" ? "Saving…" : "Unpublish & save as draft"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void submit("save")}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              {busy === "save" ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              disabled={busy !== null || !publishCheck.valid}
              title={
                publishCheck.valid
                  ? undefined
                  : `Complete the Quick View tab first: ${publishCheck.missing.join(", ")}`
              }
              onClick={() => void submit("publish")}
              className={cn(buttonVariants({ size: "lg" }), !publishCheck.valid && "opacity-50")}
            >
              {busy === "publish" ? "Publishing…" : "Publish"}
            </button>
          </>
        )}
        {product ? (
          <Link
            href={`/admin/products/${product.id}/preview`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-1.5")}
          >
            <Eye className="size-4" />
            Preview
          </Link>
        ) : null}
        <Link
          href="/admin/products"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Cancel
        </Link>
        {!publishCheck.valid && !isPublished ? (
          <p className="text-muted-foreground w-full text-xs">
            To publish, complete: {publishCheck.missing.join(" · ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
