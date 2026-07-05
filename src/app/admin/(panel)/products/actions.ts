"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  validatePublishTier,
  copySlug,
  nextSortOrder,
  sortOrderSequence,
} from "@/lib/product-admin";

// ─────────────────────────────────────────────────────────────────────────────
// Payload types — the tiered editor submits ONE JSON object (nested lists
// don't fit flat FormData).
// ─────────────────────────────────────────────────────────────────────────────

export type EditorFeature = {
  title: string;
  description: string;
  image: string | null;
};

export type ProductPayload = {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  highlights: string[];
  description: string;
  technicalDetails: string;
  coverImage: string | null;
  gallery: string[];
  categoryId: string | null;
  tech: string[];
  lifecycle: "live" | "beta" | "soon";
  year: string;
  liveUrl: string;
  repoUrl: string;
  seoDescription: string;
  ogImage: string | null;
  featured: boolean;
  features: EditorFeature[];
  /** Ordered — index becomes the link sort_order. */
  relatedPostIds: string[];
};

export type SaveIntent = "save" | "publish" | "unpublish";

export type SaveProductResult =
  | { ok: true; id: string }
  | { ok: false; missing: string[]; error: string | null };

export type MutationResult = { ok: boolean; error: string | null };

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

function revalidateProductPaths(slugs: (string | null | undefined)[] = []) {
  revalidatePath("/");
  revalidatePath("/products");
  for (const slug of slugs) if (slug) revalidatePath(`/products/${slug}`);
  revalidatePath("/admin/products");
}

const LIFECYCLES = ["live", "beta", "soon"] as const;

function sanitize(payload: ProductPayload) {
  return {
    slug: payload.slug.trim().toLowerCase(),
    name: payload.name.trim(),
    tagline: payload.tagline.trim() || null,
    summary: payload.summary.trim() || null,
    highlights: payload.highlights.map((h) => h.trim()).filter(Boolean),
    description: payload.description.trim() || null,
    technical_details: payload.technicalDetails.trim() || null,
    cover_image: payload.coverImage || null,
    gallery: payload.gallery.filter(Boolean),
    category_id: payload.categoryId || null,
    tech: payload.tech.map((t) => t.trim()).filter(Boolean),
    lifecycle: LIFECYCLES.includes(payload.lifecycle) ? payload.lifecycle : "live",
    year: payload.year.trim() || null,
    live_url: payload.liveUrl.trim() || null,
    repo_url: payload.repoUrl.trim() || null,
    seo_description: payload.seoDescription.trim() || null,
    og_image: payload.ogImage || null,
    featured: payload.featured,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// saveProductFull — fields + features replace + links replace, one action.
// ─────────────────────────────────────────────────────────────────────────────

export async function saveProductFull(
  id: string | null,
  intent: SaveIntent,
  payload: ProductPayload,
): Promise<SaveProductResult> {
  const fields = sanitize(payload);
  if (!fields.name || !fields.slug) {
    return { ok: false, missing: [], error: "Name and slug are required." };
  }

  const supabase = await createServerSupabaseClient();

  let current: { status: "draft" | "published"; slug: string; published_at: string | null } | null =
    null;
  if (id) {
    const { data } = await supabase
      .from("products")
      .select("status, slug, published_at")
      .eq("id", id)
      .maybeSingle();
    if (!data) return { ok: false, missing: [], error: "Product not found." };
    current = data;
  }

  // Spec §3: the Quick View tier must be complete to BE or REMAIN published.
  // "save" on a published row keeps it published, so it re-runs the same
  // validation; the editor offers intent "unpublish" as the escape hatch.
  const targetStatus: "draft" | "published" =
    intent === "publish" ? "published" : intent === "unpublish" ? "draft" : (current?.status ?? "draft");

  if (targetStatus === "published") {
    const check = validatePublishTier({
      name: fields.name,
      tagline: fields.tagline ?? "",
      summary: fields.summary ?? "",
      highlights: fields.highlights,
      coverImage: fields.cover_image,
      categoryId: fields.category_id,
    });
    if (!check.valid) return { ok: false, missing: check.missing, error: null };
  }

  const record = {
    ...fields,
    status: targetStatus,
    published_at:
      targetStatus === "published"
        ? (current?.published_at ?? new Date().toISOString())
        : (current?.published_at ?? null),
  };

  let productId: string;
  if (id) {
    const { error } = await supabase.from("products").update(record).eq("id", id);
    if (error) return { ok: false, missing: [], error: error.message };
    productId = id;
  } else {
    const { data, error } = await supabase.from("products").insert(record).select("id").single();
    if (error || !data) {
      return { ok: false, missing: [], error: error?.message ?? "Insert failed." };
    }
    productId = data.id;
  }

  // Replace features (delete + insert: tiny volumes, trivial ordering writes).
  const delFeatures = await supabase.from("product_features").delete().eq("product_id", productId);
  if (delFeatures.error) return { ok: false, missing: [], error: delFeatures.error.message };
  const featureRows = payload.features
    .map((f) => ({
      title: f.title.trim(),
      description: f.description.trim() || null,
      image: f.image || null,
    }))
    .filter((f) => f.title)
    .map((f, i) => ({ ...f, product_id: productId, sort_order: (i + 1) * 10 }));
  if (featureRows.length > 0) {
    const { error } = await supabase.from("product_features").insert(featureRows);
    if (error) return { ok: false, missing: [], error: error.message };
  }

  // Replace related-post links.
  const delLinks = await supabase.from("product_blog_links").delete().eq("product_id", productId);
  if (delLinks.error) return { ok: false, missing: [], error: delLinks.error.message };
  if (payload.relatedPostIds.length > 0) {
    const linkRows = payload.relatedPostIds.map((postId, i) => ({
      product_id: productId,
      blog_post_id: postId,
      sort_order: (i + 1) * 10,
    }));
    const { error } = await supabase.from("product_blog_links").insert(linkRows);
    if (error) return { ok: false, missing: [], error: error.message };
  }

  revalidateProductPaths([fields.slug, current && current.slug !== fields.slug ? current.slug : null]);
  return { ok: true, id: productId };
}

// ─────────────────────────────────────────────────────────────────────────────
// reorderProducts — persists the admin drag order as sort_order 10, 20, 30 …
// ─────────────────────────────────────────────────────────────────────────────

export async function reorderProducts(orderedIds: string[]): Promise<MutationResult> {
  const supabase = await createServerSupabaseClient();
  const orders = sortOrderSequence(orderedIds.length);
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("products")
      .update({ sort_order: orders[i] })
      .eq("id", orderedIds[i]);
    if (error) return { ok: false, error: error.message };
  }
  revalidateProductPaths();
  return { ok: true, error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// duplicateProduct — spec §3: new draft, -copy slug (retry), featured off,
// end of list, features + links copied, image URLs shared by reference.
// ─────────────────────────────────────────────────────────────────────────────

export async function duplicateProduct(id: string): Promise<MutationResult> {
  const supabase = await createServerSupabaseClient();

  const { data: source } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (!source) return { ok: false, error: "Product not found." };

  const { data: maxRow } = await supabase
    .from("products")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const copy = {
    name: `${source.name} (copy)`,
    tagline: source.tagline,
    summary: source.summary,
    highlights: source.highlights,
    description: source.description,
    technical_details: source.technical_details,
    cover_image: source.cover_image, // shared Storage object, by reference (spec §3)
    gallery: source.gallery,
    category_id: source.category_id,
    tech: source.tech,
    lifecycle: source.lifecycle,
    year: source.year,
    live_url: source.live_url,
    repo_url: source.repo_url,
    seo_description: source.seo_description,
    og_image: source.og_image,
    featured: false,
    sort_order: nextSortOrder(maxRow ? [maxRow.sort_order] : []),
    status: "draft" as const,
    published_at: null,
  };

  let newId: string | null = null;
  for (let attempt = 1; attempt <= 25 && !newId; attempt++) {
    const { data, error } = await supabase
      .from("products")
      .insert({ ...copy, slug: copySlug(source.slug, attempt) })
      .select("id")
      .single();
    if (data) newId = data.id;
    else if (error && error.code === "23505") continue; // slug taken — next suffix
    else return { ok: false, error: error?.message ?? "Insert failed." };
  }
  if (!newId) return { ok: false, error: "Could not find a free slug after 25 tries." };
  const newProductId = newId;

  const { data: features } = await supabase
    .from("product_features")
    .select("title,description,image,sort_order")
    .eq("product_id", id);
  if (features && features.length > 0) {
    const { error } = await supabase
      .from("product_features")
      .insert(features.map((f) => ({ ...f, product_id: newProductId })));
    if (error) return { ok: false, error: error.message };
  }

  const { data: links } = await supabase
    .from("product_blog_links")
    .select("blog_post_id,sort_order")
    .eq("product_id", id);
  if (links && links.length > 0) {
    const { error } = await supabase
      .from("product_blog_links")
      .insert(links.map((l) => ({ ...l, product_id: newProductId })));
    if (error) return { ok: false, error: error.message };
  }

  revalidateProductPaths(); // new row is a draft — public unaffected, admin list refreshes
  return { ok: true, error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// uploadProductImage — product-images bucket (public read / admin write, 0001).
// Requires the serverActions.bodySizeLimit bump in next.config.ts.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function uploadProductImage(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file first." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Only image files can be uploaded." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Images must be 5MB or smaller." };
  }

  const ext =
    (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `products/${crypto.randomUUID()}.${ext}`;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) return { ok: false, error: error.message };

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

// ─────────────────────────────────────────────────────────────────────────────
// deleteProduct — unchanged behavior, now also revalidates the detail path.
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createServerSupabaseClient();
  const { data: row } = await supabase.from("products").select("slug").eq("id", id).maybeSingle();
  await supabase.from("products").delete().eq("id", id);
  revalidateProductPaths([row?.slug]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy form actions — kept so product-form.tsx and the current list page
// compile until their replacements land. parseForm/ProductFormState/create/
// update are removed in Task 2; toggleProductPublished in Task 3 (it bypasses
// publish validation, which spec §3 forbids — the new list has no toggle).
// ─────────────────────────────────────────────────────────────────────────────

export type ProductFormState = { error?: string };

function parseForm(formData: FormData) {
  const tech = String(formData.get("tech") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const lifecycleRaw = String(formData.get("lifecycle") ?? "live").toLowerCase();
  const published = formData.get("published") === "on";
  const existingPublishedAt =
    String(formData.get("existing_published_at") ?? "").trim() || null;
  return {
    slug: String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase(),
    name: String(formData.get("name") ?? "").trim(),
    summary: String(formData.get("summary") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    live_url: String(formData.get("live_url") ?? "").trim() || null,
    year: String(formData.get("year") ?? "").trim() || null,
    lifecycle: (["live", "beta", "soon"].includes(lifecycleRaw) ? lifecycleRaw : "live") as
      "live" | "beta" | "soon",
    tech,
    featured: formData.get("featured") === "on",
    status: (published ? "published" : "draft") as "draft" | "published",
    published_at: published ? (existingPublishedAt ?? new Date().toISOString()) : existingPublishedAt,
  };
}

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const values = parseForm(formData);
  if (!values.name || !values.slug) return { error: "Name and slug are required." };
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("products").insert(values);
  if (error) return { error: error.message };
  revalidateProductPaths([values.slug]);
  redirect("/admin/products");
}

export async function updateProduct(
  id: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const values = parseForm(formData);
  if (!values.name || !values.slug) return { error: "Name and slug are required." };
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("products").update(values).eq("id", id);
  if (error) return { error: error.message };
  revalidateProductPaths([values.slug]);
  redirect("/admin/products");
}

export async function toggleProductPublished(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const next = formData.get("current") !== "true";
  const supabase = await createServerSupabaseClient();
  const { data: row } = await supabase
    .from("products")
    .select("published_at")
    .eq("id", id)
    .maybeSingle();
  await supabase
    .from("products")
    .update({
      status: next ? "published" : "draft",
      published_at: next ? (row?.published_at ?? new Date().toISOString()) : row?.published_at,
    })
    .eq("id", id);
  revalidateProductPaths();
}
