-- NurvexThink — add display columns used by the UI, then seed products + blog.
-- Apply in Supabase → SQL Editor after 0001. Safe to re-run (idempotent).

-- ============================================================
-- Display columns (the marketing UI shows category/status/year, and a blog
-- author name + reading time). Added separately so 0001 stays the core schema.
-- ============================================================
alter table public.products add column if not exists category text;
alter table public.products add column if not exists status text not null default 'Live';
alter table public.products add column if not exists year text;

alter table public.blog_posts add column if not exists category text;
alter table public.blog_posts add column if not exists reading_time text;
alter table public.blog_posts add column if not exists author_name text;

-- ============================================================
-- Seed: products (published). Re-running refreshes the rows by slug.
-- ============================================================
insert into public.products
  (slug, name, category, summary, description, tags, year, status, live_url, featured, published)
values
  ($s$fluxboard$s$, $s$FluxBoard$s$, $s$Productivity$s$,
   $s$A keyboard-first project board that turns standups into shipped work.$s$,
   $s$FluxBoard is a fast, keyboard-driven board for small teams. Plan, assign, and move work without lifting your hands off the keys — with realtime sync so everyone sees the same board.$s$,
   array['Next.js','Realtime','Postgres'], $s$2026$s$, $s$Live$s$, $s$#$s$, true, true),

  ($s$pulse$s$, $s$Pulse$s$, $s$Analytics$s$,
   $s$Product analytics that answer one question: what did people actually do?$s$,
   $s$Pulse is privacy-first product analytics. Track the events that matter, build funnels in seconds, and get a weekly digest of what changed — no cookie banners, no bloat.$s$,
   array['Analytics','Edge','Charts'], $s$2026$s$, $s$Live$s$, $s$#$s$, true, true),

  ($s$ledger$s$, $s$Ledger$s$, $s$Finance$s$,
   $s$Invoicing for people who would rather be building than billing.$s$,
   $s$Ledger turns a project into a paid invoice in two clicks. Recurring billing, reminders, and clean exports your accountant will actually thank you for.$s$,
   array['Payments','PDF','Stripe'], $s$2026$s$, $s$Beta$s$, $s$#$s$, false, true),

  ($s$draft$s$, $s$Draft$s$, $s$AI$s$,
   $s$An AI writing desk that drafts with your voice, not a robot's.$s$,
   $s$Draft learns how you write and helps you go from blank page to finished piece — outlines, rewrites, and tone control, with you always in the driver's seat.$s$,
   array['AI','Editor','Streaming'], $s$2026$s$, $s$Beta$s$, $s$#$s$, false, true),

  ($s$shipgate$s$, $s$ShipGate$s$, $s$Developer tools$s$,
   $s$Preview every change before it ships — a link for every pull request.$s$,
   $s$ShipGate spins up a live preview for every branch, runs your checks, and posts the link back to the PR so reviewers see the real thing, not a screenshot.$s$,
   array['CI/CD','Previews','DX'], $s$2026$s$, $s$Live$s$, $s$#$s$, true, true),

  ($s$vault$s$, $s$Vault$s$, $s$Security$s$,
   $s$Encrypted documents you can share without holding your breath.$s$,
   $s$Vault keeps sensitive documents end-to-end encrypted, with expiring links, access logs, and zero plaintext on our servers. Share confidently, revoke instantly.$s$,
   array['E2E','Storage','Audit'], $s$2026$s$, $s$Soon$s$, $s$#$s$, false, true)
on conflict (slug) do update set
  name = excluded.name, category = excluded.category, summary = excluded.summary,
  description = excluded.description, tags = excluded.tags, year = excluded.year,
  status = excluded.status, live_url = excluded.live_url, featured = excluded.featured,
  published = excluded.published;

-- ============================================================
-- Seed: blog posts (published). Body paragraphs are blank-line separated.
-- ============================================================
insert into public.blog_posts
  (slug, title, category, excerpt, reading_time, author_name, status, published_at, content)
values
  ($s$why-we-publish-our-own-software$s$, $s$Why we publish our own software$s$, $s$Studio$s$,
   $s$Building products we run ourselves keeps us honest. Here's how shipping our own tools makes the client work better.$s$,
   $s$4 min$s$, $s$Fatima Abdul Raheem$s$, $s$published$s$, $s$2026-06-18$s$,
   $c$Every studio says it cares about quality. Running our own products is how we prove it to ourselves. When we depend on the same tools we sell, we feel every slow load, every confusing screen, every surprise bill — and we fix them before a client ever would.

Publishing our software also keeps our skills honest. There's nowhere to hide when real users show up: the database has to hold, the deploy has to work, the design has to make sense without a sales call. That pressure is the best teacher we've found.

So the catalog isn't a side project. It's our research lab, our portfolio, and our promise — the clearest way to show what we'd build for you by showing what we've already built for ourselves.$c$),

  ($s$a-preview-link-from-day-one$s$, $s$A preview link from day one$s$, $s$Engineering$s$,
   $s$The single practice that removes the most risk from a software project: making the work visible before it's done.$s$,
   $s$6 min$s$, $s$Fatima Abdul Raheem$s$, $s$published$s$, $s$2026-06-05$s$,
   $c$The riskiest moment in any software project is the big reveal — weeks of work shown for the first time at the end, when changing direction is expensive. We remove that risk with one habit: a live preview link from the first day.

From day one, every change is deployed somewhere you can click. You don't read a status report; you use the product as it grows. Misunderstandings surface in hours, not at launch, and feedback lands while it's still cheap to act on.

It sounds simple, and it is — but it changes the whole relationship. The work stops being a black box and becomes a shared, visible thing. That trust is worth more than any amount of documentation.$c$),

  ($s$dark-mode-is-a-feature-not-a-toggle$s$, $s$Dark mode is a feature, not a toggle$s$, $s$Design$s$,
   $s$Designing for both themes from the start changes how you pick color. A short tour of the system behind this very site.$s$,
   $s$5 min$s$, $s$Fatima Abdul Raheem$s$, $s$published$s$, $s$2026-05-22$s$,
   $c$Dark mode bolted on at the end always looks bolted on. Colors that were picked for a white page turn muddy on black, contrast breaks, and the toggle becomes a compromise instead of a choice.

We design both themes from the start using semantic tokens — background, foreground, muted, primary — instead of hard-coded colors. Components ask for "the foreground color," and the theme decides what that means. Switching themes is then just swapping a small set of values, not rewriting the UI.

This site is built that way. The navy-and-silver of our logo carries through both modes, and an indigo accent ties them together. Try the toggle in the header — nothing should feel like an afterthought in either direction.$c$),

  ($s$scaling-to-zero-with-supabase$s$, $s$Scaling to zero with Supabase$s$, $s$Infrastructure$s$,
   $s$How we run real products on a budget that starts at nothing — and only grows when the users do.$s$,
   $s$7 min$s$, $s$Fatima Abdul Raheem$s$, $s$published$s$, $s$2026-05-09$s$,
   $c$A new product shouldn't cost money before it has users. We build so that an idle app costs almost nothing and only grows its bill when real people show up — which is exactly when you can afford it.

Supabase is a big part of how we do that: a managed Postgres database, authentication, file storage, and serverless functions on a free tier that's generous enough to launch on. No servers to babysit, no fixed monthly floor to justify before launch.

The discipline is in the architecture — push work to the edge, cache what's stable, and keep the database lean. Do that, and "scale to zero" stops being a slogan and becomes your default cost.$c$)
on conflict (slug) do update set
  title = excluded.title, category = excluded.category, excerpt = excluded.excerpt,
  reading_time = excluded.reading_time, author_name = excluded.author_name,
  status = excluded.status, published_at = excluded.published_at, content = excluded.content;
