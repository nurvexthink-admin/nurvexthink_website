import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProductStatusRow, BlogPostRow, OrderRow } from "@/lib/supabase/types";

// These run as the logged-in admin, so the "admin reads all" RLS policies return
// every row (including unpublished products and draft posts).

export async function listProductsAdmin(): Promise<ProductStatusRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getProductAdmin(id: string): Promise<ProductStatusRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function listPostsAdmin(): Promise<BlogPostRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPostAdmin(id: string): Promise<BlogPostRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function listOrdersAdmin(): Promise<OrderRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function adminCounts() {
  const supabase = await createServerSupabaseClient();
  const [products, posts, orders, newOrders] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("blog_posts").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  return {
    products: products.count ?? 0,
    posts: posts.count ?? 0,
    orders: orders.count ?? 0,
    newOrders: newOrders.count ?? 0,
  };
}
