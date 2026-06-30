import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { Product, BlogPost } from "@/lib/content";
import type { ProductStatusRow, BlogPostRow } from "@/lib/supabase/types";

function toProduct(row: ProductStatusRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category ?? "Software",
    summary: row.summary ?? "",
    description: row.description ?? "",
    status: row.status ?? "Live",
    tags: row.tags ?? [],
    year: row.year ?? "",
    liveUrl: row.live_url ?? "#",
  };
}

function toPost(row: BlogPostRow): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    category: row.category ?? "Writing",
    date: row.published_at ?? row.created_at,
    readingTime: row.reading_time ?? "",
    author: row.author_name ?? "NurvexThink",
    content: (row.content ?? "")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean),
  };
}

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map(toProduct);
  } catch {
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error || !data) return null;
    return toProduct(data);
  } catch {
    return null;
  }
}

export async function getPosts(): Promise<BlogPost[]> {
  try {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error || !data) return [];
    return data.map(toPost);
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return toPost(data);
  } catch {
    return null;
  }
}
