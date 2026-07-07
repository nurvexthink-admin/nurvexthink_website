/**
 * Database types for the NurvexThink Supabase schema.
 * Mirrors supabase/migrations/0001–0003. If you change the schema,
 * update this file (or regenerate with `supabase gen types typescript`).
 */

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  summary: string | null;
  highlights: string[];
  description: string | null;
  technical_details: string | null;
  cover_image: string | null;
  gallery: string[];
  category_id: string | null;
  tech: string[];
  lifecycle: "live" | "beta" | "soon";
  year: string | null;
  live_url: string | null;
  repo_url: string | null;
  featured: boolean;
  sort_order: number;
  status: "draft" | "published";
  seo_description: string | null;
  og_image: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductCategoryRow = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
};

export type ProductFeatureRow = {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  image: string | null;
  sort_order: number;
  created_at: string;
};

export type ProductBlogLinkRow = {
  product_id: string;
  blog_post_id: string;
  sort_order: number;
};

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  author_id: string | null;
  author_name: string | null;
  reading_time: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderRow = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  project_type: string | null;
  budget: string | null;
  details: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
};

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "owner" | "admin";
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: { slug: string; name: string } & Partial<Omit<ProductRow, "slug" | "name">>;
        Update: Partial<ProductRow>;
        Relationships: [];
      };
      product_categories: {
        Row: ProductCategoryRow;
        Insert: { name: string; slug: string } & Partial<
          Omit<ProductCategoryRow, "name" | "slug">
        >;
        Update: Partial<ProductCategoryRow>;
        Relationships: [];
      };
      product_features: {
        Row: ProductFeatureRow;
        Insert: { product_id: string; title: string } & Partial<
          Omit<ProductFeatureRow, "product_id" | "title">
        >;
        Update: Partial<ProductFeatureRow>;
        Relationships: [];
      };
      product_blog_links: {
        Row: ProductBlogLinkRow;
        Insert: ProductBlogLinkRow;
        Update: Partial<ProductBlogLinkRow>;
        Relationships: [];
      };
      blog_posts: {
        Row: BlogPostRow;
        Insert: { slug: string; title: string } & Partial<Omit<BlogPostRow, "slug" | "title">>;
        Update: Partial<BlogPostRow>;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: {
          name: string;
          email: string;
          details: string;
          company?: string | null;
          project_type?: string | null;
          budget?: string | null;
        };
        Update: Partial<OrderRow>;
        Relationships: [];
      };
      order_rate_limit: {
        Row: { ip_hash: string; created_at: string };
        Insert: { ip_hash: string; created_at?: string };
        Update: Partial<{ ip_hash: string; created_at: string }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
