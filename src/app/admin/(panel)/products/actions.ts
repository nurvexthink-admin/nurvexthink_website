"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

function revalidateAll(slug?: string) {
  revalidatePath("/");
  revalidatePath("/products");
  if (slug) revalidatePath(`/products/${slug}`);
  revalidatePath("/admin/products");
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
  revalidateAll(values.slug);
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
  revalidateAll(values.slug);
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createServerSupabaseClient();
  await supabase.from("products").delete().eq("id", id);
  revalidateAll();
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
  revalidateAll();
}
