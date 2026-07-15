import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { ChatbotSettingsRow, CompanyInfoRow } from "@/lib/supabase/types";

/**
 * Cache tags. The chat widget is mounted in the ROOT LAYOUT, so a naive read
 * would hit the database on every single page view — including for visitors who
 * never open the chat. These reads are therefore cached across requests and
 * invalidated explicitly when the admin saves (see the chatbot server actions).
 * The short `revalidate` is a safety net so a missed invalidation self-heals.
 */
export const CHATBOT_SETTINGS_TAG = "chatbot-settings";
export const CHATBOT_CONTENT_TAG = "chatbot-content";

const CACHE_SECONDS = 60;

/**
 * Builds the knowledge the chatbot is allowed to see.
 *
 * SECURITY — two different clients, on purpose:
 *
 *  - `chatbot_settings` + `company_info` are read with the SERVICE ROLE, because
 *    RLS deliberately hides them from anon (the system prompt must never be
 *    fetchable from the browser). These are fixed, parameter-free reads — no
 *    user input ever reaches a query here.
 *
 *  - Products and blog posts are read with the ANON client, so Row-Level
 *    Security is still the thing deciding which rows come back. Even if the
 *    model is successfully prompt-injected, it physically cannot be shown an
 *    unpublished draft: the database never handed one over.
 *
 * The model receives a flat, pre-rendered STRING. It gets no database handle,
 * no tools that write, and no way to widen its own access.
 */

/** Hard cap on the context we will send, so a huge DB can't blow up cost/latency. */
const MAX_PRODUCTS = 40;
const MAX_POSTS = 20;
const MAX_SECTION_CHARS = 4000;

export type ChatProduct = {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  category: string;
  tech: string[];
  lifecycle: string;
  url: string;
};

export type PublicChatSettings = {
  enabled: boolean;
  greeting: string;
  suggestedQuestions: string[];
};

/**
 * Settings row, or null when the table has not been migrated/seeded yet.
 * Cached across requests (see the tag comment above) — the admin's save
 * invalidates it immediately, so "turn the bot off" still takes effect at once.
 */
export const getChatbotSettings = unstable_cache(
  async (): Promise<ChatbotSettingsRow | null> => {
    try {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("chatbot_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error || !data) return null;
      return data as ChatbotSettingsRow;
    } catch {
      // createServiceRoleClient() THROWS when SUPABASE_SERVICE_ROLE_KEY is unset,
      // and the table may not exist before migration 0009 is applied. Neither is
      // allowed to take the site down or turn into a raw 500 — the bot simply
      // reports itself as unavailable.
      return null;
    }
  },
  ["chatbot-settings"],
  { tags: [CHATBOT_SETTINGS_TAG], revalidate: CACHE_SECONDS },
);

/**
 * The ONLY chatbot settings that may cross to the browser. Never include
 * `system_prompt` or `persona` here — that is the prompt-leak boundary.
 *
 * Wrapped in React `cache()` because the root layout, the navbar and the chat
 * widget all need it: this collapses them into ONE query per request instead of
 * three on every single page view.
 */
export const getPublicChatSettings = cache(async (): Promise<PublicChatSettings> => {
  const disabled: PublicChatSettings = {
    enabled: false,
    greeting: "",
    suggestedQuestions: [],
  };
  try {
    const settings = await getChatbotSettings();
    if (!settings || !settings.enabled) return disabled;
    return {
      enabled: true,
      greeting: settings.greeting,
      suggestedQuestions: settings.suggested_questions ?? [],
    };
  } catch {
    // Missing env vars or an unmigrated database must not crash the whole site —
    // the chat widget simply stays hidden.
    return disabled;
  }
});

const getCompanySections = unstable_cache(
  async (): Promise<CompanyInfoRow[]> => {
    try {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("company_info")
        .select("*")
        .eq("enabled", true)
        .order("sort_order", { ascending: true });
      if (error || !data) return [];
      // Empty sections are placeholders the owner has not filled in yet. Sending
      // them would teach the model to answer with blanks.
      return (data as CompanyInfoRow[]).filter((s) => s.content.trim().length > 0);
    } catch {
      // Same reason as getChatbotSettings: never throw out of a context read.
      return [];
    }
  },
  ["chatbot-company-info"],
  { tags: [CHATBOT_CONTENT_TAG], revalidate: CACHE_SECONDS },
);

/**
 * Published products the owner has not excluded from the bot.
 * Anon client => RLS applies, so a draft can never leak into the bot's context.
 *
 * Two layers of caching, deliberately:
 *  - `cache()`          dedupes within one request (layout widget + /chat page).
 *  - `unstable_cache()` dedupes ACROSS requests, so mounting the widget in the
 *    root layout does not cost a database round-trip on every page view.
 */
type ProductRowLite = {
  slug: string;
  name: string;
  tagline: string | null;
  summary: string | null;
  tech: string[] | null;
  lifecycle: string | null;
  product_categories: { name: string } | null;
};

const getChatProductsCached = unstable_cache(
  async (): Promise<ChatProduct[]> => {
    try {
      const supabase = createPublicSupabaseClient();
      const { data, error } = await supabase
        .from("products")
        .select(
          "slug,name,tagline,summary,tech,lifecycle,include_in_chatbot,product_categories(name)",
        )
        .eq("status", "published")
        .eq("include_in_chatbot", true)
        .order("featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(MAX_PRODUCTS);
      if (error || !data) return [];

      return (data as unknown as ProductRowLite[]).map((p) => ({
        slug: p.slug,
        name: p.name,
        tagline: p.tagline?.trim() ?? "",
        summary: p.summary?.trim() ?? "",
        category: p.product_categories?.name ?? "Software",
        tech: p.tech ?? [],
        lifecycle: p.lifecycle ?? "live",
        url: `/products/${p.slug}`,
      }));
    } catch {
      return [];
    }
  },
  ["chatbot-products"],
  { tags: [CHATBOT_CONTENT_TAG], revalidate: CACHE_SECONDS },
);

export const getChatProducts = cache(getChatProductsCached);

type ChatPost = { slug: string; title: string; excerpt: string };

const getChatPosts = unstable_cache(
  async (): Promise<ChatPost[]> => {
    try {
      const supabase = createPublicSupabaseClient();
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug,title,excerpt")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(MAX_POSTS);
      if (error || !data) return [];
      return data.map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt?.trim() ?? "",
      }));
    } catch {
      return [];
    }
  },
  ["chatbot-posts"],
  { tags: [CHATBOT_CONTENT_TAG], revalidate: CACHE_SECONDS },
);

function clamp(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

/**
 * Renders the context block injected above the conversation.
 *
 * Written as plain labelled text rather than JSON: it is cheaper in tokens and
 * gives the model nothing that looks like executable structure.
 */
export function renderContext(
  sections: CompanyInfoRow[],
  products: ChatProduct[],
  posts: ChatPost[],
): string {
  const parts: string[] = [];

  if (sections.length > 0) {
    parts.push(
      "## Company information\n" +
        sections
          .map((s) => `### ${s.title}\n${clamp(s.content.trim(), MAX_SECTION_CHARS)}`)
          .join("\n\n"),
    );
  }

  if (products.length > 0) {
    parts.push(
      "## Our products (these are the ONLY products that exist)\n" +
        products
          .map((p) => {
            const bits = [
              `- ${p.name} (${p.category}, status: ${p.lifecycle})`,
              p.tagline && `  Tagline: ${p.tagline}`,
              p.summary && `  Summary: ${clamp(p.summary, 500)}`,
              p.tech.length > 0 && `  Built with: ${p.tech.join(", ")}`,
              `  Page: ${p.url}`,
            ].filter(Boolean);
            return bits.join("\n");
          })
          .join("\n"),
    );
  } else {
    parts.push(
      "## Our products\nNo products are published yet. Do not invent any. If asked what we have built, say our product pages are being prepared and offer a custom order or the contact page.",
    );
  }

  if (posts.length > 0) {
    parts.push(
      "## Blog posts\n" +
        posts
          .map((p) => `- ${p.title} (/blog/${p.slug})${p.excerpt ? ` — ${clamp(p.excerpt, 200)}` : ""}`)
          .join("\n"),
    );
  }

  parts.push(
    "## Key links\n" +
      "- Custom order form: /order\n" +
      "- Contact page: /contact\n" +
      "- All products: /products\n" +
      "- Blog: /blog",
  );

  return parts.join("\n\n");
}

export type ChatContext = {
  settings: ChatbotSettingsRow;
  products: ChatProduct[];
  contextText: string;
};

/**
 * Loads everything the chat route needs in one shot.
 * Returns null when the bot is disabled or unconfigured — the caller turns that
 * into a clean 503 rather than calling OpenAI.
 */
export async function loadChatContext(): Promise<ChatContext | null> {
  try {
    const settings = await getChatbotSettings();
    if (!settings || !settings.enabled) return null;

    // Independent reads — run them together rather than serially.
    const [sections, products, posts] = await Promise.all([
      getCompanySections(),
      getChatProducts(),
      getChatPosts(),
    ]);

    return {
      settings,
      products,
      contextText: renderContext(sections, products, posts),
    };
  } catch (error) {
    // Backstop. Returning null makes the route answer a clean 503 instead of a
    // raw 500 with an empty body, which is what a caller actually needs to see.
    console.error("[chat] failed to load context", error);
    return null;
  }
}
