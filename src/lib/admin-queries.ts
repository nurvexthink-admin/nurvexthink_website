import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ProductRow,
  ProductCategoryRow,
  BlogPostRow,
  OrderRow,
} from "@/lib/supabase/types";

// These run as the logged-in admin, so the "admin reads all" RLS policies return
// every row (including unpublished products and draft posts).

/** List row: product + category name for the admin table. */
export type AdminProductRow = ProductRow & {
  product_categories: { name: string } | null;
};

/** Feature/link join shapes — structurally compatible with queries.ts's
 *  ProductRowJoined, so toProduct/toProductDetail accept AdminProductFull. */
export type AdminFeatureJoin = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  sort_order: number;
};

export type AdminLinkJoin = {
  blog_post_id: string;
  sort_order: number;
  blog_posts: {
    slug: string;
    title: string;
    excerpt: string | null;
    cover_image: string | null;
    status: "draft" | "published";
  } | null;
};

export type AdminProductFull = AdminProductRow & {
  product_features: AdminFeatureJoin[];
  product_blog_links: AdminLinkJoin[];
};

const ADMIN_PRODUCT_FULL_SELECT =
  "*, product_categories(name), product_features(id,title,description,image,sort_order), product_blog_links(blog_post_id, sort_order, blog_posts(slug,title,excerpt,cover_image,status))";

/** Ordered like the public grid (spec §2) so the admin list predicts it. */
export async function listProductsAdmin(): Promise<AdminProductRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_categories(name)")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  // Hand-rolled Database type has no Relationships metadata, so the select-string
  // parser can't type nested joins — cast to the known shape.
  return (data ?? []) as unknown as AdminProductRow[];
}

/** Product + features + links (+ post status for the draft badge / preview filter). */
export async function getProductFullAdmin(id: string): Promise<AdminProductFull | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select(ADMIN_PRODUCT_FULL_SELECT)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as AdminProductFull | null) ?? null;
}

// Legacy — removed in Task 2 when the edit page switches to getProductFullAdmin.
export async function getProductAdmin(id: string): Promise<ProductRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function listCategoriesAdmin(): Promise<ProductCategoryRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("product_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return data ?? [];
}

/** category_id → number of products referencing it (delete guard + manager UI). */
export async function countProductsByCategory(): Promise<Record<string, number>> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("products").select("category_id");
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.category_id) counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  }
  return counts;
}

/** Everything the related-posts picker needs — drafts included (they're badged). */
export type PostPickerItem = Pick<BlogPostRow, "id" | "title" | "slug" | "status">;

export async function listPostsForPicker(): Promise<PostPickerItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("id,title,slug,status")
    .order("created_at", { ascending: false });
  return data ?? [];
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
