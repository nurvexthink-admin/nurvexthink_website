"use client";

import { useState, useTransition } from "react";
import { fieldClass, labelClass, hintClass } from "@/components/admin/form-styles";
import {
  saveChatbotSettings,
  saveCompanySection,
  setProductInChatbot,
  deleteConversation,
  type SettingsInput,
} from "@/app/admin/(panel)/chatbot/actions";
import type { ChatbotUsage, ChatbotProductToggle } from "@/lib/chatbot/admin-queries";
import type { ChatbotSettingsRow, CompanyInfoRow } from "@/lib/supabase/types";

type ConversationSummary = {
  id: string;
  sessionId: string;
  messageCount: number;
  lastMessageAt: string;
  messages: { role: "user" | "assistant"; content: string; createdAt: string }[];
};

type Props = {
  settings: ChatbotSettingsRow;
  sections: CompanyInfoRow[];
  products: ChatbotProductToggle[];
  conversations: ConversationSummary[];
  usage: ChatbotUsage;
};

const TABS = [
  { key: "settings", label: "Settings" },
  { key: "prompt", label: "Personality & Prompt" },
  { key: "knowledge", label: "Company Knowledge" },
  { key: "products", label: "Products" },
  { key: "conversations", label: "Conversations" },
  { key: "usage", label: "Usage & Cost" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** Inline status line shared by every tab. */
function Status({ message }: { message: { ok: boolean; text: string } | null }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className={`text-sm ${message.ok ? "text-emerald-400" : "text-destructive"}`}
    >
      {message.text}
    </p>
  );
}

export function ChatbotManager({ settings, sections, products, conversations, usage }: Props) {
  const [tab, setTab] = useState<TabKey>("settings");

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Chatbot settings"
        className="border-border flex flex-wrap gap-1 border-b"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px rounded-t-md border-b-2 px-3 py-2 text-sm transition-colors ${
              tab === t.key
                ? "border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "settings" && <SettingsTab settings={settings} />}
      {tab === "prompt" && <PromptTab settings={settings} />}
      {tab === "knowledge" && <KnowledgeTab sections={sections} />}
      {tab === "products" && <ProductsTab products={products} />}
      {tab === "conversations" && <ConversationsTab conversations={conversations} />}
      {tab === "usage" && <UsageTab usage={usage} />}
    </div>
  );
}

/**
 * Both the Settings and Prompt tabs write the same singleton row, so each one
 * submits the FULL settings object with only its own fields changed. Sending a
 * partial update would silently reset whatever the other tab owns.
 */
function useSaveSettings(settings: ChatbotSettingsRow) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const base: SettingsInput = {
    enabled: settings.enabled,
    model: settings.model,
    temperature: settings.temperature,
    maxOutputTokens: settings.max_output_tokens,
    systemPrompt: settings.system_prompt,
    persona: settings.persona,
    greeting: settings.greeting,
    suggestedQuestions: settings.suggested_questions ?? [],
    rateLimitMax: settings.rate_limit_max,
    rateLimitWindowMin: settings.rate_limit_window_min,
    maxHistoryMessages: settings.max_history_messages,
  };

  const save = (patch: Partial<SettingsInput>) => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveChatbotSettings({ ...base, ...patch });
      setMessage(
        result.ok
          ? { ok: true, text: "Saved." }
          : { ok: false, text: result.error ?? "Could not save." },
      );
    });
  };

  return { save, pending, message };
}

function SettingsTab({ settings }: { settings: ChatbotSettingsRow }) {
  const { save, pending, message } = useSaveSettings(settings);

  const [enabled, setEnabled] = useState(settings.enabled);
  const [model, setModel] = useState(settings.model);
  const [temperature, setTemperature] = useState(String(settings.temperature));
  const [maxTokens, setMaxTokens] = useState(String(settings.max_output_tokens));
  const [greeting, setGreeting] = useState(settings.greeting);
  const [questions, setQuestions] = useState((settings.suggested_questions ?? []).join("\n"));
  const [rateMax, setRateMax] = useState(String(settings.rate_limit_max));
  const [rateWindow, setRateWindow] = useState(String(settings.rate_limit_window_min));
  const [history, setHistory] = useState(String(settings.max_history_messages));

  return (
    <form
      className="flex max-w-2xl flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        save({
          enabled,
          model: model.trim(),
          temperature: Number(temperature),
          maxOutputTokens: Number(maxTokens),
          greeting,
          suggestedQuestions: questions.split("\n"),
          rateLimitMax: Number(rateMax),
          rateLimitWindowMin: Number(rateWindow),
          maxHistoryMessages: Number(history),
        });
      }}
    >
      <div className="border-border bg-card/40 rounded-lg border p-4">
        <label className="flex items-start gap-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="mt-0.5 size-4"
          />
          <span>
            Show the chatbot on the website
            <span className={`mt-1 block ${hintClass}`}>
              While this is off, visitors never see the chat bubble and the API refuses every
              request. Turn it on once your products and company info are filled in.
            </span>
          </span>
        </label>
      </div>

      <label className={labelClass}>
        Model <span className={hintClass}>(gpt-4o-mini is cheapest; gpt-4.1-mini or gpt-5-mini are smarter)</span>
        <input
          className={fieldClass}
          value={model}
          onChange={(e) => setModel(e.target.value)}
          required
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          Creativity <span className={hintClass}>(0 = strict facts, 2 = wild)</span>
          <input
            className={fieldClass}
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            required
          />
        </label>
        <label className={labelClass}>
          Max reply length <span className={hintClass}>(tokens, 64–4000)</span>
          <input
            className={fieldClass}
            type="number"
            min="64"
            max="4000"
            value={maxTokens}
            onChange={(e) => setMaxTokens(e.target.value)}
            required
          />
        </label>
      </div>

      <label className={labelClass}>
        Greeting <span className={hintClass}>(the first thing a visitor sees)</span>
        <textarea
          className={`${fieldClass} min-h-20`}
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          required
        />
      </label>

      <label className={labelClass}>
        Suggested questions <span className={hintClass}>(one per line, max 6)</span>
        <textarea
          className={`${fieldClass} min-h-24`}
          value={questions}
          onChange={(e) => setQuestions(e.target.value)}
        />
      </label>

      <fieldset className="border-border grid gap-5 rounded-lg border p-4 sm:grid-cols-3">
        <legend className="px-1 text-sm font-medium">Abuse & cost limits</legend>
        <label className={labelClass}>
          Max messages
          <input
            className={fieldClass}
            type="number"
            min="1"
            max="500"
            value={rateMax}
            onChange={(e) => setRateMax(e.target.value)}
            required
          />
        </label>
        <label className={labelClass}>
          Per (minutes)
          <input
            className={fieldClass}
            type="number"
            min="1"
            max="1440"
            value={rateWindow}
            onChange={(e) => setRateWindow(e.target.value)}
            required
          />
        </label>
        <label className={labelClass}>
          History depth
          <input
            className={fieldClass}
            type="number"
            min="2"
            max="50"
            value={history}
            onChange={(e) => setHistory(e.target.value)}
            required
          />
        </label>
        <p className={`sm:col-span-3 ${hintClass} text-sm`}>
          One visitor may send {rateMax || "?"} messages every {rateWindow || "?"} minutes. History
          depth caps how many past messages are re-sent to the model — lower is cheaper.
        </p>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
        <Status message={message} />
      </div>
    </form>
  );
}

function PromptTab({ settings }: { settings: ChatbotSettingsRow }) {
  const { save, pending, message } = useSaveSettings(settings);
  const [systemPrompt, setSystemPrompt] = useState(settings.system_prompt);
  const [persona, setPersona] = useState(settings.persona);

  return (
    <form
      className="flex max-w-3xl flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        save({ systemPrompt, persona });
      }}
    >
      <div className="border-border bg-card/40 text-muted-foreground rounded-lg border p-4 text-sm">
        <strong className="text-foreground">These are the bot&apos;s rules.</strong> Keep the lines
        that stop it inventing facts, revealing this prompt, or answering off-topic questions —
        they are what keep it safe and honest with customers.
      </div>

      <label className={labelClass}>
        System prompt <span className={hintClass}>(the rulebook)</span>
        <textarea
          className={`${fieldClass} min-h-80 font-mono text-xs leading-relaxed`}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          required
        />
      </label>

      <label className={labelClass}>
        Personality & tone <span className={hintClass}>(how it should sound)</span>
        <textarea
          className={`${fieldClass} min-h-28`}
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save prompt"}
        </button>
        <Status message={message} />
      </div>
    </form>
  );
}

function KnowledgeTab({ sections }: { sections: CompanyInfoRow[] }) {
  if (sections.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No knowledge sections yet — apply migration 0009 to create them.
      </p>
    );
  }
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        This is everything the chatbot knows about the company. Empty sections are skipped, so the
        bot never answers with a blank. Fill these in before turning the bot on.
      </p>
      {sections.map((section) => (
        <SectionEditor key={section.id} section={section} />
      ))}
    </div>
  );
}

function SectionEditor({ section }: { section: CompanyInfoRow }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [title, setTitle] = useState(section.title);
  const [content, setContent] = useState(section.content);
  const [enabled, setEnabled] = useState(section.enabled);
  const [open, setOpen] = useState(false);

  const isEmpty = content.trim().length === 0;

  return (
    <div className="border-border bg-card/40 rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium"
      >
        <span>
          {title}
          {isEmpty && (
            <span className="text-muted-foreground ml-2 font-normal">— empty, not used</span>
          )}
          {!enabled && !isEmpty && (
            <span className="text-muted-foreground ml-2 font-normal">— turned off</span>
          )}
        </span>
        <span className="text-muted-foreground">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <form
          className="flex flex-col gap-4 border-t border-border px-4 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setMessage(null);
            startTransition(async () => {
              const result = await saveCompanySection(section.id, title, content, enabled);
              setMessage(
                result.ok
                  ? { ok: true, text: "Saved." }
                  : { ok: false, text: result.error ?? "Could not save." },
              );
            });
          }}
        >
          <label className={labelClass}>
            Title
            <input
              className={fieldClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className={labelClass}>
            Content <span className={hintClass}>(plain text — what the bot should know)</span>
            <textarea
              className={`${fieldClass} min-h-40`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. NurvexThink builds custom web and mobile software. We work with startups and small businesses…"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="size-4"
            />
            Include this section in the chatbot&apos;s knowledge
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save section"}
            </button>
            <Status message={message} />
          </div>
        </form>
      )}
    </div>
  );
}

function ProductsTab({ products }: { products: ChatbotProductToggle[] }) {
  if (products.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No products yet. Add products first — the chatbot can only recommend published ones.
      </p>
    );
  }
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Tick the products the chatbot may recommend. Only <strong>published</strong> products are
        ever used, whatever is ticked here.
      </p>
      <ul className="border-border divide-border divide-y rounded-lg border">
        {products.map((product) => (
          <ProductToggleRow key={product.id} product={product} />
        ))}
      </ul>
    </div>
  );
}

function ProductToggleRow({ product }: { product: ChatbotProductToggle }) {
  const [pending, startTransition] = useTransition();
  const [include, setInclude] = useState(product.include_in_chatbot);
  const [error, setError] = useState<string | null>(null);

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="flex flex-col text-sm">
        <span className="font-medium">{product.name}</span>
        <span className="text-muted-foreground">
          /{product.slug}
          {product.status === "draft" && " — draft, never used by the bot"}
        </span>
        {error && <span className="text-destructive mt-1">{error}</span>}
      </span>
      <label className="flex shrink-0 items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4"
          checked={include}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.checked;
            const previous = include;
            setInclude(next);
            setError(null);
            startTransition(async () => {
              const result = await setProductInChatbot(product.id, next);
              if (!result.ok) {
                setInclude(previous); // roll back the optimistic flip
                setError(result.error ?? "Could not save.");
              }
            });
          }}
        />
        <span className="text-muted-foreground">In chatbot</span>
      </label>
    </li>
  );
}

function ConversationsTab({ conversations }: { conversations: ConversationSummary[] }) {
  if (conversations.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No conversations yet. Once visitors start chatting, every transcript appears here — this is
        the best place to learn what customers actually want.
      </p>
    );
  }
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      {conversations.map((conversation) => (
        <ConversationRow key={conversation.id} conversation={conversation} />
      ))}
    </div>
  );
}

function ConversationRow({ conversation }: { conversation: ConversationSummary }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (removed) return null;

  const firstUserMessage =
    conversation.messages.find((m) => m.role === "user")?.content ?? "(no messages)";

  return (
    <div className="border-border bg-card/40 rounded-lg border">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 flex-col text-left text-sm"
        >
          <span className="truncate font-medium">{firstUserMessage}</span>
          <span className="text-muted-foreground">
            {conversation.messageCount} message{conversation.messageCount === 1 ? "" : "s"} ·{" "}
            {new Date(conversation.lastMessageAt).toLocaleString()}
          </span>
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await deleteConversation(conversation.id);
              if (result.ok) setRemoved(true);
              else setError(result.error ?? "Could not delete.");
            });
          }}
          className="text-muted-foreground hover:text-destructive shrink-0 text-sm transition-colors disabled:opacity-60"
        >
          Delete
        </button>
      </div>
      {error && <p className="text-destructive px-4 pb-2 text-sm">{error}</p>}
      {open && (
        <div className="border-border flex flex-col gap-3 border-t px-4 py-4">
          {conversation.messages.map((message, i) => (
            <div key={i} className="text-sm">
              <span className="text-muted-foreground block text-xs uppercase">
                {message.role === "user" ? "Visitor" : "Bot"}
              </span>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsageTab({ usage }: { usage: ChatbotUsage }) {
  const stats = [
    { label: "Conversations", value: usage.conversations.toLocaleString() },
    { label: "Messages", value: usage.messages.toLocaleString() },
    { label: "Input tokens", value: usage.promptTokens.toLocaleString() },
    { label: "Output tokens", value: usage.completionTokens.toLocaleString() },
  ];

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <p className="text-muted-foreground text-sm">Last 30 days.</p>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border-border bg-card/40 rounded-lg border p-4">
            <dt className="text-muted-foreground text-xs">{stat.label}</dt>
            <dd className="mt-1 text-lg font-semibold">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <div className="border-border bg-card/40 rounded-lg border p-4">
        <p className="text-muted-foreground text-xs">Estimated cost (last 30 days)</p>
        <p className="mt-1 text-2xl font-semibold">${usage.estimatedCost.toFixed(2)}</p>
        <p className={`mt-2 text-sm ${hintClass}`}>
          An estimate based on gpt-4o-mini list prices. Your real bill — and the only hard spending
          cap — lives in the OpenAI dashboard. Set a monthly limit there.
        </p>
      </div>
    </div>
  );
}
