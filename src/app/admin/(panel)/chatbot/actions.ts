"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CHATBOT_SETTINGS_TAG, CHATBOT_CONTENT_TAG } from "@/lib/chatbot/context";

export type ChatbotActionResult = { ok: boolean; error: string | null };

const SESSION_EXPIRED_ERROR = "Your session has expired — sign in again.";
const NOT_SAVED_ERROR = "Nothing was saved — your session may have expired. Sign in again.";

async function requireUser(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * The bot is mounted in the root layout, and its settings/context reads are cached
 * across requests (unstable_cache) so they do not hit the database on every page
 * view. That makes explicit invalidation mandatory: without it, switching the bot
 * off would take up to a minute to actually take effect.
 *
 * "settings" = the on/off switch, prompt, model, limits.
 * "content"  = company knowledge and which products the bot may recommend.
 * They are separate tags so editing one does not needlessly evict the other.
 *
 * `updateTag` (not `revalidateTag`) is the Next 16 API for server actions: it
 * gives read-your-own-writes, so the admin sees the new value on the very next
 * render instead of a stale one.
 */
function revalidateChatbot(scope: "settings" | "content") {
  updateTag(scope === "settings" ? CHATBOT_SETTINGS_TAG : CHATBOT_CONTENT_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/admin/chatbot");
}

/** Mirrors the CHECK constraints in migration 0009 so the UI fails before the DB does. */
const LIMITS = {
  temperature: { min: 0, max: 2 },
  maxOutputTokens: { min: 64, max: 4000 },
  rateLimitMax: { min: 1, max: 500 },
  rateLimitWindow: { min: 1, max: 1440 },
  maxHistory: { min: 2, max: 50 },
} as const;

function inRange(value: number, range: { min: number; max: number }): boolean {
  return Number.isFinite(value) && value >= range.min && value <= range.max;
}

export type SettingsInput = {
  enabled: boolean;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  systemPrompt: string;
  persona: string;
  greeting: string;
  suggestedQuestions: string[];
  rateLimitMax: number;
  rateLimitWindowMin: number;
  maxHistoryMessages: number;
};

export async function saveChatbotSettings(input: SettingsInput): Promise<ChatbotActionResult> {
  const model = input.model.trim();
  const systemPrompt = input.systemPrompt.trim();
  const greeting = input.greeting.trim();

  if (!model) return { ok: false, error: "A model name is required." };
  if (!systemPrompt) {
    return { ok: false, error: "The system prompt cannot be empty — it is the bot's rulebook." };
  }
  if (!greeting) return { ok: false, error: "A greeting message is required." };
  if (!inRange(input.temperature, LIMITS.temperature)) {
    return { ok: false, error: "Temperature must be between 0 and 2." };
  }
  if (!inRange(input.maxOutputTokens, LIMITS.maxOutputTokens)) {
    return { ok: false, error: "Max reply length must be between 64 and 4000 tokens." };
  }
  if (!inRange(input.rateLimitMax, LIMITS.rateLimitMax)) {
    return { ok: false, error: "Rate limit must be between 1 and 500 messages." };
  }
  if (!inRange(input.rateLimitWindowMin, LIMITS.rateLimitWindow)) {
    return { ok: false, error: "Rate-limit window must be between 1 and 1440 minutes." };
  }
  if (!inRange(input.maxHistoryMessages, LIMITS.maxHistory)) {
    return { ok: false, error: "History depth must be between 2 and 50 messages." };
  }

  const supabase = await createServerSupabaseClient();
  const user = await requireUser(supabase);
  if (!user) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const { data, error } = await supabase
    .from("chatbot_settings")
    .update({
      enabled: input.enabled,
      model,
      temperature: input.temperature,
      max_output_tokens: input.maxOutputTokens,
      system_prompt: systemPrompt,
      persona: input.persona.trim(),
      greeting,
      suggested_questions: input.suggestedQuestions
        .map((q) => q.trim())
        .filter(Boolean)
        .slice(0, 6),
      rate_limit_max: input.rateLimitMax,
      rate_limit_window_min: input.rateLimitWindowMin,
      max_history_messages: input.maxHistoryMessages,
    })
    .eq("id", 1)
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: NOT_SAVED_ERROR };

  revalidateChatbot("settings");
  return { ok: true, error: null };
}

export async function saveCompanySection(
  id: string,
  title: string,
  content: string,
  enabled: boolean,
): Promise<ChatbotActionResult> {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return { ok: false, error: "A section title is required." };
  if (trimmedTitle.length > 120) {
    return { ok: false, error: "Section title must be 120 characters or fewer." };
  }
  if (content.length > 20000) {
    return { ok: false, error: "Section content must be 20,000 characters or fewer." };
  }

  const supabase = await createServerSupabaseClient();
  const user = await requireUser(supabase);
  if (!user) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const { data, error } = await supabase
    .from("company_info")
    .update({ title: trimmedTitle, content, enabled })
    .eq("id", id)
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: NOT_SAVED_ERROR };

  revalidateChatbot("content");
  return { ok: true, error: null };
}

export async function setProductInChatbot(
  productId: string,
  include: boolean,
): Promise<ChatbotActionResult> {
  const supabase = await createServerSupabaseClient();
  const user = await requireUser(supabase);
  if (!user) return { ok: false, error: SESSION_EXPIRED_ERROR };

  const { data, error } = await supabase
    .from("products")
    .update({ include_in_chatbot: include })
    .eq("id", productId)
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: NOT_SAVED_ERROR };

  revalidateChatbot("content");
  return { ok: true, error: null };
}

export async function deleteConversation(id: string): Promise<ChatbotActionResult> {
  const supabase = await createServerSupabaseClient();
  const user = await requireUser(supabase);
  if (!user) return { ok: false, error: SESSION_EXPIRED_ERROR };

  // chat_messages is ON DELETE CASCADE, so the transcript goes with it.
  const { error } = await supabase.from("chat_conversations").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/chatbot");
  return { ok: true, error: null };
}
