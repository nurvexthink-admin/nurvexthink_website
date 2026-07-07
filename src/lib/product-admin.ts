/**
 * Pure helpers for the products admin (spec §3). No I/O — unit-tested.
 * validatePublishTier runs twice per save: client-side for instant feedback,
 * server-side (saveProductFull) as the authority.
 */

export type PublishTierFields = {
  name: string;
  tagline: string;
  summary: string;
  highlights: string[];
  coverImage: string | null;
  categoryId: string | null;
};

export type PublishCheck = { valid: boolean; missing: string[] };

/**
 * Spec §3: the Quick View tier must be complete for a product to be — or
 * remain — published. Labels are shown verbatim in the editor's error banner.
 */
export function validatePublishTier(f: PublishTierFields): PublishCheck {
  const missing: string[] = [];
  if (!f.name.trim()) missing.push("Name");
  if (!f.tagline.trim()) missing.push("Tagline");
  if (!f.summary.trim()) missing.push("Summary");
  if (f.highlights.filter((h) => h.trim()).length < 3) missing.push("At least 3 highlights");
  if (!f.coverImage) missing.push("Cover image");
  if (!f.categoryId) missing.push("Category");
  return { valid: missing.length === 0, missing };
}

/** Same shape the 0003 migration used to slugify category names. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Duplicate-slug candidates (spec §3): `-copy`, then `-copy-2`, `-copy-3`…
 * Duplicating a duplicate re-uses the original base (no `-copy-copy`).
 */
export function copySlug(slug: string, attempt: number): string {
  const base = slug.replace(/-copy(-\d+)?$/, "");
  return attempt <= 1 ? `${base}-copy` : `${base}-copy-${attempt}`;
}

/** Next end-of-list sort_order — keeps 0003's convention of gaps of 10. */
export function nextSortOrder(existing: number[]): number {
  return existing.length === 0 ? 10 : Math.max(...existing) + 10;
}

/** 10, 20, 30 … for a full reorder write. */
export function sortOrderSequence(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * 10);
}

/**
 * A link that's safe to render as an href — must be an absolute http(s) URL.
 * Blocks `javascript:`, `data:`, and other schemes that could execute on click.
 * Empty is treated safe (the field is optional; callers coerce it to null).
 */
export function isSafeHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Returns the URL if it's a safe http(s) link, else null (drops it). */
export function safeHttpUrlOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed && isSafeHttpUrl(trimmed) ? trimmed : null;
}
