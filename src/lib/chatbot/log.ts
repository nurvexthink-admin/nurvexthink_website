import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/service";

/**
 * Conversation logging. Every write goes through the service role because the
 * chat tables grant nothing to anon (see migration 0009).
 *
 * Logging must NEVER break a conversation: a customer losing their answer
 * because an analytics insert failed would be a self-inflicted outage. Every
 * function here swallows its own errors and reports failure by returning null.
 */

/** Finds or creates the conversation row for this browser session. */
export async function ensureConversation(
  sessionId: string,
  ipHash: string,
): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient();

    const { data: existing } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existing?.id) return existing.id;

    const { data: created, error } = await supabase
      .from("chat_conversations")
      .insert({ session_id: sessionId, ip_hash: ipHash })
      .select("id")
      .single();

    if (error || !created) return null;
    return created.id;
  } catch {
    return null;
  }
}

export async function logUserMessage(
  conversationId: string,
  content: string,
): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    await supabase
      .from("chat_messages")
      .insert({ conversation_id: conversationId, role: "user", content });
  } catch {
    // Logging is best-effort by design.
  }
}

export async function logAssistantMessage(
  conversationId: string,
  content: string,
  promptTokens: number | null,
  completionTokens: number | null,
): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
    });

    // Keep the conversation row's summary columns current so the admin list can
    // sort by recency without touching chat_messages.
    const { count } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId);

    await supabase
      .from("chat_conversations")
      .update({
        message_count: count ?? 0,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId);
  } catch {
    // Logging is best-effort by design.
  }
}
