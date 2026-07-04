-- NurvexThink — 0004: reseed content for the POST-0003 schema.
-- Context: the DB was found empty after 0003 was applied (all seed rows gone,
-- including blog_posts, which 0003 never touches — consistent with a database
-- reset before the migration run). The 0002 seed can no longer be used (it
-- references dropped columns), so this file re-creates the same content in the
-- new shape. Idempotent: upserts by slug / name; safe to re-run.

-- ============================================================
-- Categories
-- ============================================================
insert into public.product_categories (name, slug, sort_order) values
  ($s$Productivity$s$,    $s$productivity$s$,    10),
  ($s$Analytics$s$,       $s$analytics$s$,       20),
  ($s$Finance$s$,         $s$finance$s$,         30),
  ($s$AI$s$,              $s$ai$s$,              40),
  ($s$Developer tools$s$, $s$developer-tools$s$, 50),
  ($s$Security$s$,        $s$security$s$,        60)
on conflict (name) do update set
  slug = excluded.slug, sort_order = excluded.sort_order;

-- ============================================================
-- Products (new shape: lifecycle + status/published_at + tech + sort_order + FK)
-- ============================================================
insert into public.products
  (slug, name, summary, description, tech, year, lifecycle, live_url,
   featured, status, published_at, sort_order, category_id)
values
  ($s$fluxboard$s$, $s$FluxBoard$s$,
   $s$A keyboard-first project board that turns standups into shipped work.$s$,
   $s$FluxBoard is a fast, keyboard-driven board for small teams. Plan, assign, and move work without lifting your hands off the keys — with realtime sync so everyone sees the same board.$s$,
   array['Next.js','Realtime','Postgres'], $s$2026$s$, $s$live$s$, $s$#$s$,
   true, $s$published$s$, now(), 10,
   (select id from public.product_categories where name = $s$Productivity$s$)),

  ($s$pulse$s$, $s$Pulse$s$,
   $s$Product analytics that answer one question: what did people actually do?$s$,
   $s$Pulse is privacy-first product analytics. Track the events that matter, build funnels in seconds, and get a weekly digest of what changed — no cookie banners, no bloat.$s$,
   array['Analytics','Edge','Charts'], $s$2026$s$, $s$live$s$, $s$#$s$,
   true, $s$published$s$, now(), 20,
   (select id from public.product_categories where name = $s$Analytics$s$)),

  ($s$ledger$s$, $s$Ledger$s$,
   $s$Invoicing for people who would rather be building than billing.$s$,
   $s$Ledger turns a project into a paid invoice in two clicks. Recurring billing, reminders, and clean exports your accountant will actually thank you for.$s$,
   array['Payments','PDF','Stripe'], $s$2026$s$, $s$beta$s$, $s$#$s$,
   false, $s$published$s$, now(), 30,
   (select id from public.product_categories where name = $s$Finance$s$)),

  ($s$draft$s$, $s$Draft$s$,
   $s$An AI writing desk that drafts with your voice, not a robot's.$s$,
   $s$Draft learns how you write and helps you go from blank page to finished piece — outlines, rewrites, and tone control, with you always in the driver's seat.$s$,
   array['AI','Editor','Streaming'], $s$2026$s$, $s$beta$s$, $s$#$s$,
   false, $s$published$s$, now(), 40,
   (select id from public.product_categories where name = $s$AI$s$)),

  ($s$shipgate$s$, $s$ShipGate$s$,
   $s$Preview every change before it ships — a link for every pull request.$s$,
   $s$ShipGate spins up a live preview for every branch, runs your checks, and posts the link back to the PR so reviewers see the real thing, not a screenshot.$s$,
   array['CI/CD','Previews','DX'], $s$2026$s$, $s$live$s$, $s$#$s$,
   true, $s$published$s$, now(), 50,
   (select id from public.product_categories where name = $s$Developer tools$s$)),

  ($s$vault$s$, $s$Vault$s$,
   $s$Encrypted documents you can share without holding your breath.$s$,
   $s$Vault keeps sensitive documents end-to-end encrypted, with expiring links, access logs, and zero plaintext on our servers. Share confidently, revoke instantly.$s$,
   array['E2E','Storage','Audit'], $s$2026$s$, $s$soon$s$, $s$#$s$,
   false, $s$published$s$, now(), 60,
   (select id from public.product_categories where name = $s$Security$s$))
on conflict (slug) do update set
  name = excluded.name, summary = excluded.summary,
  description = excluded.description, tech = excluded.tech,
  year = excluded.year, lifecycle = excluded.lifecycle,
  live_url = excluded.live_url, featured = excluded.featured,
  status = excluded.status,
  published_at = coalesce(public.products.published_at, excluded.published_at),
  sort_order = excluded.sort_order, category_id = excluded.category_id;

-- ============================================================
-- Blog posts (unchanged shape; content identical to the 0002 seed)
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
   $s$6 min$s$, $s$Muhammad Ali$s$, $s$published$s$, $s$2026-06-05$s$,
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
   $s$7 min$s$, $s$Muhammad Ali$s$, $s$published$s$, $s$2026-05-09$s$,
   $c$A new product shouldn't cost money before it has users. We build so that an idle app costs almost nothing and only grows its bill when real people show up — which is exactly when you can afford it.

Supabase is a big part of how we do that: a managed Postgres database, authentication, file storage, and serverless functions on a free tier that's generous enough to launch on. No servers to babysit, no fixed monthly floor to justify before launch.

The discipline is in the architecture — push work to the edge, cache what's stable, and keep the database lean. Do that, and "scale to zero" stops being a slogan and becomes your default cost.$c$)
on conflict (slug) do update set
  title = excluded.title, category = excluded.category, excerpt = excluded.excerpt,
  reading_time = excluded.reading_time, author_name = excluded.author_name,
  status = excluded.status, published_at = excluded.published_at, content = excluded.content;

-- ============================================================
-- Verify (run the whole file; this prints the counts)
-- ============================================================
select
  (select count(*) from public.products)           as products,
  (select count(*) from public.product_categories) as categories,
  (select count(*) from public.blog_posts)         as posts;
-- Expect: products = 6, categories = 6, posts = 4.

-- ============================================================
-- AFTER auth users exist again (if the reset also wiped Authentication →
-- add the admin users back in Dashboard → Authentication → Add user, then):
-- ============================================================
-- update public.profiles set role = 'owner'
--   where email = 'fatima.abdulraheemdev.17@gmail.com';
-- select email, role from public.profiles;
