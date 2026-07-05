-- NurvexThink — 0005: quick-view content (taglines + highlights), sample
-- features, and product↔blog links so the new public sections are visible
-- with real content. Idempotent.

-- Quick-view tier: a short tagline + plain-language highlights per product.
update public.products p
set tagline = v.tagline, highlights = v.highlights
from (values
  ($s$fluxboard$s$, $s$Standups in, shipped work out.$s$,
   array[$s$Plan and assign without touching the mouse$s$,
         $s$Everyone sees the same board, instantly$s$,
         $s$Built for small teams that move fast$s$]),
  ($s$pulse$s$, $s$See what people actually did.$s$,
   array[$s$Build a funnel in seconds — no SQL$s$,
         $s$No cookies, so no cookie banner$s$,
         $s$A weekly digest of what changed$s$]),
  ($s$ledger$s$, $s$From project to paid, in two clicks.$s$,
   array[$s$Invoices that send themselves$s$,
         $s$Polite automatic payment reminders$s$,
         $s$Exports your accountant will love$s$]),
  ($s$draft$s$, $s$An AI writing desk with your voice.$s$,
   array[$s$Learns how you write, not how robots write$s$,
         $s$Outlines, rewrites, and tone control$s$,
         $s$You stay in the driver's seat$s$]),
  ($s$shipgate$s$, $s$A live preview for every change.$s$,
   array[$s$Every branch gets a clickable link$s$,
         $s$Checks run before anyone reviews$s$,
         $s$Reviewers see the real thing, not screenshots$s$]),
  ($s$vault$s$, $s$Share sensitive files without holding your breath.$s$,
   array[$s$End-to-end encrypted, always$s$,
         $s$Links that expire when you say so$s$,
         $s$Revoke access instantly$s$])
) as v(slug, tagline, highlights)
where p.slug = v.slug;

-- FluxBoard features
insert into public.product_features (product_id, title, description, sort_order)
select p.id, f.title, f.description, f.sort_order
from public.products p,
     (values
       ($s$Keyboard-first flow$s$, $s$Every action has a shortcut — plan, assign, and move work without touching the mouse.$s$, 10),
       ($s$Realtime sync$s$, $s$Everyone sees the same board, instantly. No refresh button, no "who has the latest?"$s$, 20)
     ) as f(title, description, sort_order)
where p.slug = $s$fluxboard$s$
  and not exists (
    select 1 from public.product_features x
    where x.product_id = p.id and x.title = f.title
  );

-- Pulse features
insert into public.product_features (product_id, title, description, sort_order)
select p.id, f.title, f.description, f.sort_order
from public.products p,
     (values
       ($s$Funnels in seconds$s$, $s$Pick the events, see the drop-off. No SQL, no waiting on a data team.$s$, 10),
       ($s$Privacy-first$s$, $s$No cookies, no fingerprinting — analytics you don't need a banner for.$s$, 20)
     ) as f(title, description, sort_order)
where p.slug = $s$pulse$s$
  and not exists (
    select 1 from public.product_features x
    where x.product_id = p.id and x.title = f.title
  );

-- Product ↔ blog links
insert into public.product_blog_links (product_id, blog_post_id, sort_order)
select p.id, b.id, l.sort_order
from (values
       ($s$fluxboard$s$, $s$a-preview-link-from-day-one$s$, 10),
       ($s$fluxboard$s$, $s$why-we-publish-our-own-software$s$, 20),
       ($s$pulse$s$,     $s$scaling-to-zero-with-supabase$s$, 10)
     ) as l(product_slug, post_slug, sort_order)
join public.products p on p.slug = l.product_slug
join public.blog_posts b on b.slug = l.post_slug
on conflict (product_id, blog_post_id) do update set sort_order = excluded.sort_order;

select
  (select count(*) from public.product_features)   as features,
  (select count(*) from public.product_blog_links) as links;
-- Expect: features = 4, links = 3.
