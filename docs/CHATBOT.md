# AI Chatbot — setup & how it works

The chatbot ships **switched OFF**. Nothing appears on the website until you turn it on in
`/admin/chatbot`. Follow these three steps when you are ready.

---

## Step 1 — Apply the database migration

Supabase → **SQL Editor** → paste the whole of `supabase/migrations/0009_chatbot.sql` → **Run**.
It is idempotent, so re-running it is safe.

This creates: `chatbot_settings`, `company_info`, `chat_conversations`, `chat_messages`,
`chat_rate_limit`, and adds `products.include_in_chatbot`.

## Step 2 — Add the OpenAI key

**Local development** — create `.env.local` (it is git-ignored, never committed):

```
OPENAI_API_KEY=sk-...your key...
```

**Production** — Vercel → Project → Settings → Environment Variables:

| Name | Value | Environment |
|---|---|---|
| `OPENAI_API_KEY` | your key | Production (+ Preview) |

> ⚠️ **NEVER name it `NEXT_PUBLIC_OPENAI_API_KEY`.** The `NEXT_PUBLIC_` prefix is what ships a
> variable to the browser. Without that prefix the key stays on the server and the browser only
> ever receives the streamed answer.

> 💰 **Set a hard monthly spend limit in the OpenAI dashboard.** It is the only real cap on cost.

The route also needs `SUPABASE_SERVICE_ROLE_KEY`, which is already set (the order form uses it).

## Step 3 — Fill it in, then switch it on

Go to **`/admin/chatbot`**:

1. **Company Knowledge** — fill in About, Services, Process, Pricing, Custom orders, Contact, FAQ.
   **Empty sections are skipped**, so the bot never answers with a blank.
2. **Products** — tick which products the bot may recommend (only *published* ones are ever used).
3. **Settings** — tick **"Show the chatbot on the website"** and save.

Turning it on makes the floating bubble and the **AI Assistant** nav tab appear. Turning it off
removes them, 404s `/chat`, and makes the API refuse every request.

---

## How it is kept safe

| Risk | What stops it |
|---|---|
| **API key theft** | Key is read only inside `/api/chat`, which runs on the server. Verified: it is not in the client bundle. |
| **Reading drafts / customer orders** | The bot's product & blog context is read with the **anon key**, so RLS decides what is visible. Even a fully successful prompt injection cannot surface an unpublished row — the database never returns one. |
| **System-prompt leakage** | `chatbot_settings` has **no anon policy** at all. It is unreadable from the browser. |
| **Prompt injection** | The bot has **no tools and no database handle** — it only ever sees a pre-rendered string. User text is stripped of control characters and forged `</user_message>` tags, then wrapped in a delimiter the system prompt tells the model to treat as data. |
| **Spam / cost abuse** | Per-IP rate limit (IP stored only as a salted SHA-256 hash), message-length cap, history-depth cap, output-token cap. The rate limiter **fails closed** — if it cannot verify the limit, no OpenAI call is made. |
| **Hallucinated products** | Product cards are only rendered for slugs that actually exist. A made-up slug produces no card (`links.test.ts` proves this). |
| **A runaway bill** | Cheap model (`gpt-4o-mini`), caps above, usage dashboard in the admin panel, and your OpenAI spend limit. |

## How it knows about the company

On every message the server builds a context block from:
- **`company_info`** — the sections you edit in the admin panel
- **published products** you have ticked (name, tagline, summary, tech, URL)
- **published blog posts**
- the key links (`/order`, `/contact`, `/products`, `/blog`)

It is **not** a vector/RAG system, deliberately: with a few dozen products the whole knowledge base
fits in the prompt, and RAG would add cost and failure modes for no benefit. If the catalogue ever
grows past roughly 30–50 items, `renderContext()` in `src/lib/chatbot/context.ts` is the one place
to swap in retrieval.

## Performance

The widget is mounted in the root layout, so its settings/content reads are cached across requests
(`unstable_cache`) and would otherwise hit the database on every page view. Saving in the admin
panel calls `updateTag(...)`, so changes take effect immediately rather than after the 60s TTL.

## Voice

Uses the browser's built-in Web Speech API — **free, no API key, no per-character cost**:
- **Input:** speech-to-text (Chrome/Edge/Safari; Firefox has no support and the mic button hides).
- **Output:** text-to-speech, **off by default** (audio that starts on its own is hostile). The
  visitor toggles "Voice on".

There is deliberately **no 3D avatar**: `CLAUDE.md` fixes the site at one WebGL scene, and a second
live canvas would hurt mid-range phones for no measured conversion benefit. The speaking indicator
is CSS/SVG only.

## Files

```
supabase/migrations/0009_chatbot.sql   tables, RLS, seed prompt
src/lib/chatbot/context.ts             builds what the model may see  (server-only)
src/lib/chatbot/guard.ts               rate limit + input sanitising  (server-only)
src/lib/chatbot/log.ts                 conversation logging           (server-only)
src/lib/chatbot/links.ts               product-card extraction        (pure, tested)
src/lib/chatbot/limits.ts              limits shared with the browser
src/app/api/chat/route.ts              the secure endpoint
src/components/chat/                   widget, panel, voice, orb
src/app/chat/page.tsx                  the full-page /chat
src/app/admin/(panel)/chatbot/         the admin control page
```
