import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ChatbotSettingsRow,
  CompanyInfoRow,
  ChatConversationRow,
  ChatMessageRow,
} from "@/lib/supabase/types";

/**
 * Admin-panel reads for the chatbot. These run as the logged-in admin, so the
 * "admin reads" RLS policies from migration 0009 return every row. The service
 * role is deliberately NOT used here — the admin's own session is the authority.
 */

export async function getSettingsAdmin(): Promise<ChatbotSettingsRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("chatbot_settings").select("*").eq("id", 1).maybeSingle();
  return (data as ChatbotSettingsRow | null) ?? null;
}

export async function listCompanyInfoAdmin(): Promise<CompanyInfoRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("company_info")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data as CompanyInfoRow[] | null) ?? [];
}

/** Products the owner can tick/untick for the bot's knowledge. */
export type ChatbotProductToggle = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published";
  include_in_chatbot: boolean;
};

export async function listProductsForChatbot(): Promise<ChatbotProductToggle[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select("id,name,slug,status,include_in_chatbot")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  return (data as ChatbotProductToggle[] | null) ?? [];
}

export async function listConversationsAdmin(limit = 50): Promise<ChatConversationRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("chat_conversations")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(limit);
  return (data as ChatConversationRow[] | null) ?? [];
}

/**
 * All messages for many conversations in ONE query, grouped by conversation.
 *
 * The obvious version (loop the conversations, fetch each transcript) is an N+1:
 * 30 conversations meant 30 round-trips. This is a single `in (...)` read.
 */
export async function getMessagesByConversation(
  conversationIds: string[],
): Promise<Map<string, ChatMessageRow[]>> {
  const grouped = new Map<string, ChatMessageRow[]>();
  if (conversationIds.length === 0) return grouped;

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("chat_messages")
    .select("*")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: true });

  for (const row of (data as ChatMessageRow[] | null) ?? []) {
    const existing = grouped.get(row.conversation_id);
    if (existing) existing.push(row);
    else grouped.set(row.conversation_id, [row]);
  }
  return grouped;
}

export type ChatbotUsage = {
  conversations: number;
  messages: number;
  promptTokens: number;
  completionTokens: number;
  /** Rough USD estimate; the rate is per 1M tokens. */
  estimatedCost: number;
};

/**
 * Usage for the last 30 days. Token prices are gpt-4o-mini's published rates
 * ($0.15 / 1M input, $0.60 / 1M output) — a guide, not a bill. The authoritative
 * spend (and the hard cap) lives in the OpenAI dashboard. If you switch models in
 * the admin panel, update these two numbers to keep the estimate roughly honest.
 */
const USD_PER_1M_INPUT = 0.15;
const USD_PER_1M_OUTPUT = 0.6;

export async function getChatbotUsage(): Promise<ChatbotUsage> {
  const supabase = await createServerSupabaseClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();

  const [{ count: conversations }, { data: messages }] = await Promise.all([
    supabase
      .from("chat_conversations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    supabase
      .from("chat_messages")
      .select("prompt_tokens,completion_tokens")
      .gte("created_at", since),
  ]);

  const rows = (messages as Pick<ChatMessageRow, "prompt_tokens" | "completion_tokens">[]) ?? [];
  const promptTokens = rows.reduce((sum, r) => sum + (r.prompt_tokens ?? 0), 0);
  const completionTokens = rows.reduce((sum, r) => sum + (r.completion_tokens ?? 0), 0);

  return {
    conversations: conversations ?? 0,
    messages: rows.length,
    promptTokens,
    completionTokens,
    estimatedCost:
      (promptTokens / 1_000_000) * USD_PER_1M_INPUT +
      (completionTokens / 1_000_000) * USD_PER_1M_OUTPUT,
  };
}
