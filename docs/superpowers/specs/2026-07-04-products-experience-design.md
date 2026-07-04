# Products Experience — Design Spec

**Date:** 2026-07-04 (rev 2: two-tier interface + related blogs; hardened after adversarial
review against the live schema)
**Status:** Approved (design phase)
**Owner:** Fatima Abdul Raheem (CEO)
**Depth decision:** Content + presentation control (owner-approved 2026-07-04)

## 1. Overview

Build the **products experience** for the NurvexThink main site: a public product showcase
driven end-to-end by a flexible admin. The showcase is **two-tier by design** — an
approachable **Quick View** (a box that opens on the same page, plain language, for
everyone) and a **full technical page** (for technical readers). Each product can also
reference **related blog posts**, so readers flow from product → deep-dive articles.

The admin controls both **what** shows (content, media, related posts) and **how** it's
arranged (order, pinning, categories, publish state) — with drafts and preview, so nothing
goes live by accident. The editor is organized around the two public tiers so the generic
tier is quick and foolproof to fill.

**Ground truth:** the original site-spec schema is already live on project
`axbsghyqhhdaiylcksbv` (migrations `0001` + `0002`: `profiles`, `products`, `blog_posts`,
`orders`, storage policies, admin auth, seeded products). This spec therefore defines a
**data-preserving migration** of that schema, never a fresh install.

### Why this shape (from the 2026-07-03 admin-flexibility research)

We reviewed a reference admin (Fatima's portfolio) end-to-end. Its strengths — every admin
field labeled with its public destination; instant content propagation — are adopted here.
Its gaps define our differentiators:

| Reference gap | Our answer |
|---|---|
| No ordering/pinning | `sort_order` + drag-to-reorder; featured pinning |
| Everything live on save | Draft → Published workflow + preview |
| Hardcoded category dropdown | Admin-managed categories table |
| No detail pages / SEO | `/products/[slug]` pages with per-product SEO |
| No live preview | Preview renders the real public pages from draft data |
| One-size-fits-all cards | Two-tier: Quick View for everyone, technical page for devs |

### Goals

- Two-tier presentation: plain-language Quick View first; technical depth one click away.
- Public showcase that sells: filterable grid + rich detail pages linking to live apps.
- Products cross-link to related blog posts (and posts link back when the blog ships).
- Admin can reshape the grid without a deploy, fill the generic tier fast, and can never
  leave a half-empty public page (validation on publish **and** on edits to published
  products).
- Safe publishing: draft/preview/publish; nothing accidental.
- Schema evolution that keeps today's six live seed products rendering throughout.

### Non-goals (deferred)

- Blog **admin** & orders inbox (separate specs; `blog_posts` already exists and the
  product↔post links ship here, so relations work from day one).
- Payments, client accounts.
- Full site-builder (home hero/stats editing from admin) — revisit after products ship.

## 2. Public UX

### `/products` — showcase grid

- Card: cover image, name, **tagline**, category pill, lifecycle badge (`Beta` / `Soon`
  when applicable), Featured badge. Tech chips live in the technical tier — cards stay
  approachable. (This intentionally replaces today's tag chips on cards.)
- Filter pills from the categories table (+ "All"); empty categories hidden.
- Order: `featured DESC, sort_order ASC, created_at DESC` (deterministic tiebreak).
- **Cards are real links** (`<a href="/products/[slug]">`) whose click is intercepted to
  open the Quick View — so crawlers and no-JS users get the detail page (SEO-safe), while
  JS users get the overlay.
- Server Component; data via the Supabase server client; `revalidatePath` on admin
  mutations keeps it fresh without polling.

### Quick View — tier 1, for everyone

- A dialog over the grid: cover image, name, category, **tagline**, **highlights**
  (3–6 plain-language benefit bullets), CTA row (see CTA rules below) + **Full technical
  details →** (real navigation to `/products/[slug]`), plus up to two related-post chips
  when set.
- **URL mechanics:** opening writes `?p=<slug>` via `history.pushState` (no server
  round-trip, no RSC refetch); the dialog's open state hydrates client-side from
  `useSearchParams`, so the page itself stays cacheable. Back/Esc/backdrop close it.
  Direct visits to `/products?p=<slug>` open the grid with the box already open.
  An unknown, draft, or malformed `?p=` value is **silently ignored** (grid renders, no
  dialog). `/products` keeps `rel="canonical"` pointing at itself regardless of `?p=`, and
  every published product appears in the sitemap as `/products/[slug]`.
- No extra fetch: quick-view fields ship with the grid query (text-only payload).
- Focus-trapped, `role="dialog"`, labeled by the product name.
- Content rule for this tier: **zero jargon** — the admin fields are labeled accordingly.

### `/products/[slug]` — tier 2, the technical page

- **Overview strip first** (same info as Quick View: cover, tagline, highlights) so
  non-technical visitors who land here directly aren't lost.
- Then the technical body: long description (Markdown), **Technical details** section
  (architecture, stack decisions, implementation notes — Markdown), tech chips, gallery
  grid, CTAs (rules below).
- **Related posts** section: cards (title, excerpt, cover) for the linked *published*
  blog posts → `/blog/[slug]`; the section hides itself when none are linked. Blog posts
  will show a "Built product: X" backlink chip when the blog admin ships (noted for that
  spec).
- A **"Request something like this"** CTA linking to `/order?ref=<slug>`.
- SEO: `generateMetadata` from `seo_description` (fallback: tagline + summary) + OG image
  (`og_image` fallback: cover). Published products only; drafts 404 publicly.

### CTA rules (both tiers)

- `live_url` set **and** `lifecycle != 'soon'` → primary **Open live app**.
- `lifecycle = 'soon'` or `live_url` empty → disabled **Coming soon** state (never a dead
  link). `live_url` stays optional at publish time by design — unreleased products are
  legitimate.
- `repo_url` set → secondary **View repo** (technical page only).

## 3. Admin UX (`/admin/products`)

- **List view:** cover thumb, name, category, status badge (Draft / Published), lifecycle,
  Featured star, **drag-to-reorder** (persists `sort_order`); filter by status/category;
  **Duplicate** action. The list groups featured items first to mirror the public order
  (dragging a normal product above a featured one can't change the public result, and the
  UI should not pretend otherwise). **Reordering is disabled while a filter is active** —
  positions are global.

- **Editor — organized by audience tier**, tabs mirroring the public surfaces so filling
  the generic product page is quick, guided, and logical:
  1. **Quick View tab** *(the box everyone sees first)* — name, slug (auto from name,
     editable), tagline *(card + quick view headline)*, summary *(quick view intro)*,
     **highlights list editor** (add / remove / drag-reorder short benefit bullets, with
     "plain language, no jargon" helper text), category select, cover image upload,
     live URL, lifecycle select (live / beta / soon), featured toggle.
  2. **Technical tab** *(the detail page)* — long description (Markdown), technical
     details (Markdown), tech list, gallery uploads, repo URL, year.
  3. **SEO & Links tab** — SEO description *(search results)*, OG image *(social shares)*,
     and the **Related blog posts picker**: search posts by title, multi-select,
     drag-order; drafts selectable but flagged "won't show until the post is published".

- **Publish validation** — the Quick View tier must be complete (name, tagline, summary,
  ≥ 3 highlights, cover image, category) for a product to be **or remain** published:
  - Publish button enables only when valid.
  - **Saving edits to a published product re-runs the same validation**; an invalid save
    is blocked with the option to *Unpublish & save as draft* instead. This closes the
    "edit a live product into a half-empty page" hole.
  - Drafts save anytime, half-finished.

- **Preview** (admin-only): renders the *actual* public components for both tiers from
  the **last saved draft** (save-first; the preview route at
  `/admin/products/[id]/preview` fetches with the admin client). To make this drift-proof,
  the public tier components are **pure/prop-driven** — routes do the fetching (anon
  client on public routes, admin client on preview) and pass data in.

- **Duplicate** semantics: copies as a new **draft**; slug gets a `-copy` / `-copy-2`
  suffix with a uniqueness retry; `featured` resets to false; `sort_order` = end of list;
  related-post links are copied; **image URLs are copied by reference** (both products
  share the same Storage objects — any future "delete product + its images" cleanup must
  check for other referrers first; flagged here for that future work).

- **Categories manager:** add / rename / delete / reorder. Delete blocked while products
  reference the category (reassign first).

- Uploads go to the `product-images` Storage bucket (public read, admin write — policies
  already live from `0001`).

## 4. Data model (Supabase)

### Migration path — `0003` transforms the live schema (data-preserving)

The DB already holds `products` with `published bool`, `status text default 'Live'`
(Live / Beta / Soon), `category text`, `tags text[]`, `year text`, and six seeded rows.
Migration `0003` (single transaction):

1. `product_categories` created; distinct existing `category` strings inserted as rows;
   `products.category_id` FK added and backfilled by name; the old `category text` column
   dropped.
2. Existing `status` (Live/Beta/Soon) **renamed to `lifecycle`**, values lowercased,
   `check in ('live','beta','soon')`.
3. New `status text check in ('draft','published')` derived from `published bool`
   (`true → 'published'`, else `'draft'`); `published_at` backfilled from `updated_at`
   for published rows; then `published bool` dropped. (The CHECK is added **after** the
   backfill — adding it first would fail against existing rows.)
4. `tags` **renamed to `tech`** (same type).
5. New columns: `tagline text`, `highlights text[] default '{}'`,
   `technical_details text`, `gallery text[] default '{}'`, `sort_order int default 0`
   (backfilled 10, 20, 30… by current `created_at` order so the grid is stable and
   insertable), `seo_description text`, `og_image text`.
6. `product_blog_links` junction created.
7. Policy + trigger fixes from §5.

Seed data survives every step; `/products` renders identically before and after (PR 1
updates the queries/view-models to the new column names in the same PR).

### Final shapes

**`product_categories`** — `id uuid PK` · `name text` · `slug text unique` ·
`sort_order int` · `created_at`

**`products`** — `id uuid PK` · `slug text unique` · `name text` ·
`tagline text` *(quick-view headline)* · `summary text` *(quick-view intro)* ·
`highlights text[]` *(quick-view bullets)* · `description text` (Markdown) ·
`technical_details text` (Markdown) · `cover_image text` · `gallery text[]` ·
`category_id uuid FK → product_categories (nullable)` · `tech text[]` ·
`lifecycle text check in ('live','beta','soon') default 'live'` · `year text` ·
`live_url text` · `repo_url text` · `featured bool default false` ·
`sort_order int default 0` · `status text check in ('draft','published')` ·
`seo_description text` · `og_image text` · `published_at timestamptz` ·
`created_at` · `updated_at`

**`blog_posts`** — already live (0001/0002); unchanged here.

**`product_blog_links`** — `product_id uuid FK → products` ·
`blog_post_id uuid FK → blog_posts` · `sort_order int default 0` ·
PK `(product_id, blog_post_id)` · both FKs `ON DELETE CASCADE`

**`profiles`** — already live; role-protection hardened (§5).

### Indexes

Existing indexes kept; added: `products(category_id)`, `products(sort_order)`,
`products(lifecycle)`, `product_categories(slug)`, `product_blog_links(product_id)`,
`product_blog_links(blog_post_id)` — every column an RLS policy or common filter touches.

### RLS (default-deny, enabled on every table)

- `products`: public `SELECT` where `status = 'published'` (policy updated from the old
  `published bool`); admins full access.
- `product_categories`: public `SELECT`; admins full access.
- `blog_posts`: unchanged (public reads published; admins full).
- `product_blog_links`: public `SELECT` **only when both sides are published** —
  `USING (EXISTS (select 1 from products p where p.id = product_id and
  p.status = 'published') AND EXISTS (select 1 from blog_posts b where
  b.id = blog_post_id and b.status = 'published'))` — so anon users can't count posts
  attached to unreleased products or see draft-post UUIDs. The junction FK indexes keep
  this cheap. Admins full access.
- `profiles`: user reads own row; admins read all; **role changes owner-gated by trigger**
  (§5 — RLS alone cannot express column-level rules).
- Storage `product-images`: unchanged from 0001 (public read; admin write).

Migrations are SQL files committed under `supabase/migrations/` and applied to project
`axbsghyqhhdaiylcksbv` via the Supabase SQL editor or CLI.

## 5. Auth & guarding

- Supabase Auth email/password (already live) for the three admin accounts;
  `/admin/login` + guarded `(panel)` layout already exist and are reused.
- **Privilege-escalation fix (0003):** the 0001 `"profiles: self can update"` policy lets
  any signed-in user set their own `role`. 0003 adds a `BEFORE UPDATE` trigger on
  `profiles` that rejects any change to `role` unless the caller's own profile role is
  `'owner'`, and re-scopes the self-update policy. (A trigger, not RLS, because RLS is
  row-granular and cannot see which column changed.)
- `service_role` key never leaves the server; mutations run through Server Actions that
  re-verify the admin session.

## 6. Performance

- Server Components throughout; client leaves only where interactive: the Quick View
  dialog, admin drag list, editor form, uploads.
- Quick View costs no extra request — its fields ride the grid query; open/close is
  `pushState`-only (no RSC refetch).
- Public pages cached; admin mutations call `revalidatePath('/products')` (+ the detail
  path), so publishing is instant without polling.
- `next/image` everywhere.
- Drag-and-drop: `@dnd-kit` (accessible: keyboard + touch, which native HTML5 DnD lacks —
  the admin must work on tablets). The one new dependency this feature adds.

## 7. Testing

- Unit: slug generation + duplicate-suffix retry, ordering logic (tiebreaks), status
  transitions, publish-validation rules (including edits to published products),
  category-delete guard.
- Component: product card (link + intercepted click), grid filtering, Quick View (opens
  on click, closes on Esc/backdrop/Back, `?p=` deep link opens, invalid `?p=` ignored,
  "Full technical details" navigates), CTA rules (live / soon / no-URL states), editor
  tier tabs + field→destination labels, related-posts section hidden when empty.
- RLS: impersonation checklist — anon sees only published products/posts **and junction
  rows whose both sides are published**; anon writes fail; non-owner admin cannot change
  `profiles.role` (trigger test).
- Migration: 0003 dry-run against a copy of live data; `/products` renders identically
  pre/post.
- Manual: draft → preview (both tiers) → publish → appears publicly; reorder reflects on
  `/products`; unpublish 404s the detail page and drops the card.

## 8. Build order (three PRs)

1. **`feat/products-schema`** — migration 0003 (transform live schema per §4: categories,
   lifecycle/status/tech renames, new columns, junction, RLS updates, role trigger,
   indexes, sort_order backfill); typed query/view-model updates (`queries.ts`,
   `content.ts`, card/detail props) so the current UX keeps rendering unchanged.
2. **`feat/products-public`** — two-tier UX: grid + Quick View dialog (`?p=` pushState
   deep links) + `/products/[slug]` technical page with related posts, CTA rules, SEO +
   sitemap, order-form CTA, empty states. Public tier components refactored to
   prop-driven (preview-ready).
3. **`feat/products-admin`** — tiered CRUD editor with publish validation (incl.
   published-edit revalidation), draft/preview/publish, drag reorder (@dnd-kit),
   categories manager, related-posts picker, duplicate action, image uploads,
   revalidation.

Each PR ships the full green bar (typecheck, lint, tests, build) + screenshots before merge.
