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
  /** When false, the AI chatbot must not see or recommend this product (0009). */
  include_in_chatbot: boolean;
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

/**
 * Chatbot configuration — a single pinned row (id = 1). Holds the system prompt,
 * so it is admin-only at the RLS level and must never be sent to the browser.
 */
export type ChatbotSettingsRow = {
  id: 1;
  enabled: boolean;
  model: string;
  temperature: number;
  max_output_tokens: number;
  system_prompt: string;
  persona: string;
  greeting: string;
  suggested_questions: string[];
  rate_limit_max: number;
  rate_limit_window_min: number;
  max_history_messages: number;
  updated_at: string;
};

/** One editable block of company knowledge fed to the chatbot. */
export type CompanyInfoRow = {
  id: string;
  section_key: string;
  title: string;
  content: string;
  sort_order: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatConversationRow = {
  id: string;
  session_id: string;
  ip_hash: string | null;
  message_count: number;
  created_at: string;
  last_message_at: string;
};

export type ChatMessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  created_at: string;
};

/** Admin-editable recipients for the internal "new lead" alert (singleton, id = 1). */
export type NotificationSettingsRow = {
  id: 1;
  lead_recipients: string[];
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
      chatbot_settings: {
        Row: ChatbotSettingsRow;
        Insert: Partial<ChatbotSettingsRow> & { id?: 1 };
        Update: Partial<ChatbotSettingsRow>;
        Relationships: [];
      };
      company_info: {
        Row: CompanyInfoRow;
        Insert: { section_key: string; title: string } & Partial<
          Omit<CompanyInfoRow, "section_key" | "title">
        >;
        Update: Partial<CompanyInfoRow>;
        Relationships: [];
      };
      chat_conversations: {
        Row: ChatConversationRow;
        Insert: { session_id: string } & Partial<Omit<ChatConversationRow, "session_id">>;
        Update: Partial<ChatConversationRow>;
        Relationships: [];
      };
      chat_messages: {
        Row: ChatMessageRow;
        Insert: { conversation_id: string; role: ChatMessageRow["role"]; content: string } & Partial<
          Omit<ChatMessageRow, "conversation_id" | "role" | "content">
        >;
        Update: Partial<ChatMessageRow>;
        Relationships: [];
      };
      chat_rate_limit: {
        Row: { ip_hash: string; created_at: string };
        Insert: { ip_hash: string; created_at?: string };
        Update: Partial<{ ip_hash: string; created_at: string }>;
        Relationships: [];
      };
      notification_settings: {
        Row: NotificationSettingsRow;
        Insert: Partial<NotificationSettingsRow> & { id?: 1 };
        Update: Partial<NotificationSettingsRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
