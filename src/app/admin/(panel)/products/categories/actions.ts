"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { slugify, nextSortOrder, sortOrderSequence } from "@/lib/product-admin";

export type CategoryActionResult = { ok: boolean; error: string | null };

function revalidateCategoryPaths() {
  revalidatePath("/");
  revalidatePath("/products"); // filter pills come from this table
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/categories");
}

export async function createCategory(name: string): Promise<CategoryActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Category name is required." };
  const supabase = await createServerSupabaseClient();
  const { data: rows } = await supabase.from("product_categories").select("sort_order");
  const sort_order = nextSortOrder((rows ?? []).map((r) => r.sort_order));
  const { error } = await supabase
    .from("product_categories")
    .insert({ name: trimmed, slug: slugify(trimmed), sort_order });
  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505" ? "A category with that name already exists." : error.message,
    };
  }
  revalidateCategoryPaths();
  return { ok: true, error: null };
}

export async function renameCategory(id: string, name: string): Promise<CategoryActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Category name is required." };
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("product_categories")
    .update({ name: trimmed, slug: slugify(trimmed) })
    .eq("id", id);
  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505" ? "A category with that name already exists." : error.message,
    };
  }
  revalidateCategoryPaths();
  return { ok: true, error: null };
}

/**
 * Spec §3: delete is blocked while products reference the category. The FK is
 * ON DELETE SET NULL (0003), so the database would NOT stop us — this guard is
 * the only thing standing between the admin and silently uncategorized products.
 */
export async function deleteCategory(id: string): Promise<CategoryActionResult> {
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if (count && count > 0) {
    return {
      ok: false,
      error: `${count} product${count === 1 ? "" : "s"} still use${count === 1 ? "s" : ""} this category — reassign ${count === 1 ? "it" : "them"} in the product editor first.`,
    };
  }
  const { error } = await supabase.from("product_categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateCategoryPaths();
  return { ok: true, error: null };
}

// Assumes orderedIds is the complete id set (the drag list is never filtered).
export async function reorderCategories(orderedIds: string[]): Promise<CategoryActionResult> {
  const supabase = await createServerSupabaseClient();
  const orders = sortOrderSequence(orderedIds.length);
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("product_categories")
      .update({ sort_order: orders[i] })
      .eq("id", orderedIds[i]);
    if (error) return { ok: false, error: error.message };
  }
  revalidateCategoryPaths();
  return { ok: true, error: null };
}
