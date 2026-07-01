/**
 * Database types for the NurvexThink Supabase schema.
 * Mirrors supabase/migrations/0001_initial_schema.sql. If you change the schema,
 * update this file (or regenerate with `supabase gen types typescript`).
 */

export type ProductStatusRow = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  summary: string | null;
  description: string | null;
  cover_image: string | null;
  live_url: string | null;
  repo_url: string | null;
  tags: string[];
  year: string | null;
  status: "Live" | "Beta" | "Soon";
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
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
        Row: ProductStatusRow;
        Insert: { slug: string; name: string } & Partial<Omit<ProductStatusRow, "slug" | "name">>;
        Update: Partial<ProductStatusRow>;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
