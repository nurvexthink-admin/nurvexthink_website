import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { MAX_USER_MESSAGE_CHARS } from "./limits";

/**
 * Abuse controls for the chat endpoint.
 *
 * Mirrors the proven pattern already used by the order form: hash the IP with a
 * salt (so we never store a raw address), count recent rows, and - unlike the
 * order form - fail CLOSED. A lead is precious and worth letting through on a DB
 * hiccup; an LLM call costs real money on every request, so if we cannot verify
 * the limit we refuse rather than hand an attacker a free budget.
 */

const IP_HASH_SALT = "nurvexthink-chat-rl";

// Single source of truth, shared with the browser (see limits.ts). The client
// treats them as UX hints; this file is where they are actually enforced.
export { MAX_USER_MESSAGE_CHARS, MAX_MESSAGES_PER_REQUEST } from "./limits";

export async function clientIpHash(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  return createHash("sha256").update(IP_HASH_SALT + ip).digest("hex");
}

export type RateLimitResult = { limited: boolean; reason?: string };

/**
 * Records this request and reports whether the IP is over its budget.
 * Fails CLOSED: any error means we do not spend money on an OpenAI call.
 */
export async function checkRateLimit(
  ipHash: string,
  max: number,
  windowMin: number,
): Promise<RateLimitResult> {
  try {
    const supabase = createServiceRoleClient();
    const since = new Date(Date.now() - windowMin * 60_000).toISOString();

    const { count, error } = await supabase
      .from("chat_rate_limit")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);

    if (error) return { limited: true, reason: "rate-limit-unavailable" };
    if ((count ?? 0) >= max) return { limited: true, reason: "rate-limit-exceeded" };

    const { error: insertError } = await supabase
      .from("chat_rate_limit")
      .insert({ ip_hash: ipHash });
    if (insertError) return { limited: true, reason: "rate-limit-unavailable" };

    // Opportunistic cleanup keeps the table small; only the recent window matters.
    const cutoff = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    await supabase.from("chat_rate_limit").delete().lt("created_at", cutoff);

    return { limited: false };
  } catch {
    return { limited: true, reason: "rate-limit-unavailable" };
  }
}

const TAB = 9;
const NEWLINE = 10;
const CARRIAGE_RETURN = 13;

/**
 * True for C0/C1 control characters, except tab / newline / carriage return,
 * which are legitimate in a chat message. Control characters are invisible to a
 * human but can be used to smuggle instructions past a naive filter.
 *
 * Done by code point rather than a regex literal so no control byte ever has to
 * appear in this source file.
 */
function isControlChar(code: number): boolean {
  if (code === TAB || code === NEWLINE || code === CARRIAGE_RETURN) return false;
  return code <= 31 || (code >= 127 && code <= 159);
}

function stripControlChars(text: string): string {
  let out = "";
  for (const char of text) {
    const code = char.codePointAt(0);
    if (code === undefined || !isControlChar(code)) out += char;
  }
  return out;
}

/**
 * Neutralises what a user could type to break out of their turn: a forged
 * delimiter tag, smuggled control characters, and unbounded length.
 *
 * This is defence in depth, NOT the primary control. The real guarantees are
 * (a) the model has no tools and no database handle, and (b) products/posts are
 * read through the anon key, so RLS makes drafts unreachable even on a total
 * prompt-injection win.
 */
export function sanitiseUserMessage(raw: string): string {
  const withoutDelimiters = raw.replace(/<\/?user_message>/gi, "");
  return stripControlChars(withoutDelimiters).slice(0, MAX_USER_MESSAGE_CHARS).trim();
}

/** Wraps untrusted input so the model treats it as data, per the system prompt. */
export function wrapUserMessage(text: string): string {
  return `<user_message>\n${text}\n</user_message>`;
}
