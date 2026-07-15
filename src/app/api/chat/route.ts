import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { loadChatContext } from "@/lib/chatbot/context";
import {
  checkRateLimit,
  clientIpHash,
  sanitiseUserMessage,
  wrapUserMessage,
  MAX_MESSAGES_PER_REQUEST,
} from "@/lib/chatbot/guard";
import { ensureConversation, logAssistantMessage, logUserMessage } from "@/lib/chatbot/log";

/**
 * The chatbot endpoint.
 *
 * SECURITY BOUNDARY — this file is the whole reason the design is safe:
 *
 *  1. It runs ONLY on the server. `OPENAI_API_KEY` is read from a non-public env
 *     var, so it is never bundled for the browser. The client receives streamed
 *     text and nothing else. (Naming it NEXT_PUBLIC_* would leak it — never do that.)
 *  2. The model is given NO tools and NO database handle. It cannot query, write,
 *     or widen its own access. It only ever sees a pre-rendered context string.
 *  3. That context is built with the ANON Supabase key, so RLS decides what is
 *     visible. Drafts, orders and admin data are unreachable even if the model is
 *     fully prompt-injected.
 *  4. Every request is rate-limited per IP (hashed), fails closed, and both the
 *     message length and history depth are capped before any spend occurs.
 */

// Streaming a chat reply can legitimately take a while; cap it well under
// Vercel's limit so a hung upstream call cannot pin a function open.
export const maxDuration = 60;

// Reads request headers and per-request state — must never be cached.
export const dynamic = "force-dynamic";

type ChatRequestBody = {
  messages?: UIMessage[];
  sessionId?: string;
};

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Pulls the plain text out of a UIMessage's parts array. */
function textOf(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export async function POST(req: Request): Promise<Response> {
  // The key is validated up front so a misconfigured deploy fails loudly here
  // rather than as a confusing stream error in the user's browser.
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[chat] OPENAI_API_KEY is not set");
    return jsonError("The assistant is not configured yet.", 503);
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const incoming = body.messages;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return jsonError("No messages provided.", 400);
  }
  if (incoming.length > MAX_MESSAGES_PER_REQUEST) {
    return jsonError("This conversation is too long. Please start a new chat.", 413);
  }

  // The bot is off, unconfigured, or the DB is unreachable -> never call OpenAI.
  const context = await loadChatContext();
  if (!context) {
    return jsonError("The assistant is currently unavailable.", 503);
  }
  const { settings, contextText } = context;

  const ipHash = await clientIpHash();
  const rate = await checkRateLimit(
    ipHash,
    settings.rate_limit_max,
    settings.rate_limit_window_min,
  );
  if (rate.limited) {
    const message =
      rate.reason === "rate-limit-exceeded"
        ? "You've sent a lot of messages — please try again in a few minutes."
        : "The assistant is busy right now. Please try again shortly.";
    return jsonError(message, 429);
  }

  // Trim history to the admin-configured depth (keeping the most recent turns),
  // so a long chat cannot grow the bill without bound.
  const trimmed = incoming.slice(-settings.max_history_messages);

  const latest = trimmed[trimmed.length - 1];
  if (!latest || latest.role !== "user") {
    return jsonError("The last message must come from the user.", 400);
  }

  const latestText = sanitiseUserMessage(textOf(latest));
  if (!latestText) {
    return jsonError("Please type a message.", 400);
  }

  // Rebuild the conversation with every user turn sanitised and wrapped in the
  // delimiter the system prompt instructs the model to treat as untrusted data.
  const safeMessages: UIMessage[] = trimmed.map((message) => {
    if (message.role !== "user") return message;
    const clean = sanitiseUserMessage(textOf(message));
    return {
      ...message,
      parts: [{ type: "text", text: wrapUserMessage(clean) }],
    };
  });

  const system = [
    settings.system_prompt,
    settings.persona ? `\nTONE AND PERSONALITY:\n${settings.persona}` : "",
    `\nCOMPANY CONTEXT (the only facts you may use):\n${contextText}`,
  ]
    .filter(Boolean)
    .join("\n");

  // Best-effort logging. A failure here must not cost the user their answer, so
  // conversationId may be null and every log call below tolerates that.
  const conversationId = body.sessionId
    ? await ensureConversation(body.sessionId, ipHash)
    : null;
  if (conversationId) {
    await logUserMessage(conversationId, latestText);
  }

  try {
    const openai = createOpenAI({ apiKey });

    const result = streamText({
      model: openai(settings.model),
      system,
      messages: await convertToModelMessages(safeMessages),
      temperature: settings.temperature,
      maxOutputTokens: settings.max_output_tokens,
      abortSignal: req.signal,
      onFinish: async ({ text, totalUsage }) => {
        if (!conversationId) return;
        await logAssistantMessage(
          conversationId,
          text,
          totalUsage?.inputTokens ?? null,
          totalUsage?.outputTokens ?? null,
        );
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    // Never surface a provider stack trace (it can echo the prompt) to the browser.
    console.error("[chat] streamText failed", error);
    return jsonError("Sorry — something went wrong. Please try again.", 502);
  }
}
