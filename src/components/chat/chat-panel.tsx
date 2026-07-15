"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { extractCards, cleanReplyText, type KnownProduct } from "@/lib/chatbot/links";
import { MAX_USER_MESSAGE_CHARS } from "@/lib/chatbot/limits";
import { useVoiceInput, useVoiceOutput } from "./use-voice";
import { SpeakingOrb, SpeakingBars } from "./speaking-orb";

export type ChatPanelProps = {
  greeting: string;
  suggestedQuestions: string[];
  products: KnownProduct[];
  /** Fills the viewport (the /chat page) instead of the floating bubble. */
  variant?: "page" | "popover";
};

/* -------------------------------------------------------------------------- */
/*  Session id: external (localStorage) state, so it is read with              */
/*  useSyncExternalStore. Memoised at module scope because getSnapshot must be */
/*  pure — minting a fresh UUID on every call would loop forever.              */
/* -------------------------------------------------------------------------- */

const SESSION_KEY = "nvx-chat-session";
let cachedSessionId: string | null = null;

const subscribeNever = () => () => {};

function getSessionId(): string {
  if (cachedSessionId) return cachedSessionId;
  try {
    let existing = window.localStorage.getItem(SESSION_KEY);
    if (!existing) {
      existing = crypto.randomUUID();
      window.localStorage.setItem(SESSION_KEY, existing);
    }
    cachedSessionId = existing;
  } catch {
    // Private mode / storage blocked: fall back to a per-tab id. The chat still
    // works; only cross-reload grouping in the admin panel is lost.
    cachedSessionId = crypto.randomUUID();
  }
  return cachedSessionId;
}

/** Empty on the server; the real id arrives on hydration. */
const getSessionIdOnServer = () => "";

function useSessionId(): string {
  return useSyncExternalStore(subscribeNever, getSessionId, getSessionIdOnServer);
}

function textOf(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function ChatPanel({
  greeting,
  suggestedQuestions,
  products,
  variant = "popover",
}: ChatPanelProps) {
  const sessionId = useSessionId();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport,
  });

  const isBusy = status === "submitted" || status === "streaming";

  const voiceOut = useVoiceOutput();

  // Defined before useVoiceInput so the transcript callback can be passed
  // directly. (Routing it through a ref assigned during render is a React
  // violation — refs may not be written while rendering.)
  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isBusy || !sessionId) return;
      voiceOut.cancel(); // stop the previous answer talking over the new question
      setInput("");
      void sendMessage({ text: trimmed }, { body: { sessionId } });
    },
    [isBusy, sessionId, sendMessage, voiceOut],
  );

  // Speaking into the box sends immediately — that is what makes it feel like
  // talking rather than dictating.
  const voiceIn = useVoiceInput(submit);

  // Keep the newest message in view as it streams.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  // Read each finished reply aloud exactly once. Guarding on the message id stops
  // a re-render (or a scroll) from starting the same sentence over again.
  const spokenIdRef = useRef<string | null>(null);
  const lastMessage = messages[messages.length - 1];
  useEffect(() => {
    if (status !== "ready" || !lastMessage || lastMessage.role !== "assistant") return;
    if (spokenIdRef.current === lastMessage.id) return;
    spokenIdRef.current = lastMessage.id;
    // Speak the prose the user actually reads — not the raw URLs, which sound
    // like nonsense out loud.
    voiceOut.speak(cleanReplyText(textOf(lastMessage)));
  }, [status, lastMessage, voiceOut]);

  const showSuggestions = messages.length === 0 && suggestedQuestions.length > 0;
  const isSpeakingLast = voiceOut.speaking && lastMessage?.role === "assistant";

  return (
    <div
      className={
        variant === "page" ? "flex h-[70vh] min-h-112 flex-col" : "flex h-full flex-col"
      }
    >
      {voiceOut.supported && (
        <div className="border-border flex items-center justify-between gap-2 border-b px-4 py-2">
          <span className="text-muted-foreground flex items-center gap-2 text-xs">
            <SpeakingOrb speaking={voiceOut.speaking} listening={voiceIn.listening} />
            {voiceIn.listening ? "Listening…" : voiceOut.speaking ? "Speaking…" : "Assistant"}
          </span>
          <button
            type="button"
            onClick={voiceOut.toggleEnabled}
            aria-pressed={voiceOut.enabled}
            title={voiceOut.enabled ? "Turn voice off" : "Read replies aloud"}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
              voiceOut.enabled
                ? "text-brand-indigo-2"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <SpeakerIcon on={voiceOut.enabled} />
            {voiceOut.enabled ? "Voice on" : "Voice off"}
          </button>
        </div>
      )}

      <div
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
        aria-label="Conversation"
      >
        {/* The greeting is rendered locally; it is never sent to the model. */}
        <Bubble role="assistant">
          <p className="whitespace-pre-wrap">{greeting}</p>
        </Bubble>

        {messages.map((message) => {
          const raw = textOf(message);
          if (message.role === "user") {
            return (
              <Bubble key={message.id} role="user">
                <p className="whitespace-pre-wrap">{raw}</p>
              </Bubble>
            );
          }

          const cards = extractCards(raw, products);
          const prose = cleanReplyText(raw);
          const isBeingSpoken = isSpeakingLast && message.id === lastMessage?.id;
          return (
            <Bubble key={message.id} role="assistant">
              {prose && (
                <p className="whitespace-pre-wrap">
                  {prose}
                  {isBeingSpoken && (
                    <span className="ml-2 inline-flex align-middle">
                      <SpeakingBars />
                    </span>
                  )}
                </p>
              )}
              {cards.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {cards.map((card, i) =>
                    card.kind === "product" ? (
                      <Link
                        key={`${card.slug}-${i}`}
                        href={card.href}
                        className="border-border hover:border-brand-indigo/60 hover:bg-brand-surface/60 block rounded-lg border p-3 transition-colors"
                      >
                        <span className="block text-sm font-medium">{card.name}</span>
                        {card.tagline && (
                          <span className="text-muted-foreground block text-xs">
                            {card.tagline}
                          </span>
                        )}
                        <span className="text-brand-indigo-2 mt-1 block text-xs">
                          View product →
                        </span>
                      </Link>
                    ) : (
                      <Link
                        key={`${card.kind}-${i}`}
                        href={card.kind === "order" ? "/order" : "/contact"}
                        className="bg-foreground text-background inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium"
                      >
                        {card.kind === "order" ? "Request a custom project" : "Contact the team"}
                      </Link>
                    ),
                  )}
                </div>
              )}
            </Bubble>
          );
        })}

        {status === "submitted" && (
          <Bubble role="assistant">
            <TypingDots />
          </Bubble>
        )}

        {error && (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm"
          >
            <p>Sorry — that didn&apos;t go through.</p>
            <button
              type="button"
              onClick={() => void regenerate()}
              className="mt-2 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {showSuggestions && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => submit(question)}
              className="border-border text-muted-foreground hover:text-foreground hover:border-brand-indigo/60 rounded-full border px-3 py-1.5 text-xs transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      )}

      {voiceIn.error && (
        <p role="alert" className="text-destructive px-4 pb-2 text-xs">
          {voiceIn.error}
        </p>
      )}

      <form
        className="border-border flex items-end gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Type your message
        </label>
        <textarea
          id="chat-input"
          rows={1}
          value={input}
          maxLength={MAX_USER_MESSAGE_CHARS}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter makes a new line.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(input);
            }
          }}
          placeholder={voiceIn.listening ? "Listening…" : "Ask about our products or a custom project…"}
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/40 max-h-32 min-h-10 flex-1 resize-none rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-3"
        />

        {voiceIn.supported && (
          <button
            type="button"
            onClick={() => (voiceIn.listening ? voiceIn.stop() : voiceIn.start())}
            disabled={isBusy}
            aria-pressed={voiceIn.listening}
            aria-label={voiceIn.listening ? "Stop listening" : "Speak your message"}
            title={voiceIn.listening ? "Stop listening" : "Speak your message"}
            className={`border-border flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors disabled:opacity-50 ${
              voiceIn.listening
                ? "border-emerald-400/60 text-emerald-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MicIcon />
          </button>
        )}

        <button
          type="submit"
          disabled={isBusy || !input.trim() || !sessionId}
          className="bg-foreground text-background h-10 shrink-0 rounded-lg px-4 text-sm font-medium disabled:opacity-50"
        >
          {isBusy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9v6h4l5 4V5L8 9H4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {on ? (
        <path
          d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ) : (
        <path d="M17 10l4 4m0-4l-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? "bg-foreground text-background rounded-br-sm"
            : "bg-brand-surface/80 border-border text-foreground rounded-bl-sm border"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1" aria-label="The assistant is typing">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="bg-muted-foreground size-1.5 animate-bounce rounded-full"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}
