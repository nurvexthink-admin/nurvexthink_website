-- NurvexThink — 0003: products experience (spec 2026-07-04 rev 3).
-- Transforms the LIVE schema data-preservingly. Apply in Supabase → SQL Editor
-- after 0001 + 0002. Idempotent: IF NOT EXISTS + DO $$ guards; safe to re-run.

-- ============================================================
-- 1) product_categories (admin-managed; replaces products.category text)
-- ============================================================
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_categories enable row level security;
create index if not exists product_categories_slug_idx on public.product_categories (slug);

drop policy if exists "categories: public reads" on public.product_categories;
create policy "categories: public reads" on public.product_categories
  for select to anon, authenticated
  using (true);

drop policy if exists "categories: admin writes" on public.product_categories;
create policy "categories: admin writes" on public.product_categories
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

grant select on public.product_categories to anon, authenticated;
grant insert, update, delete on public.product_categories to authenticated;

-- Backfill categories from the existing free-text column, then swap to FK.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'products'
               and column_name = 'category') then
    insert into public.product_categories (name, slug)
    select distinct p.category,
           trim(both '-' from lower(regexp_replace(p.category, '[^a-zA-Z0-9]+', '-', 'g')))
    from public.products p
    where p.category is not null and p.category <> ''
    on conflict (name) do nothing;
  end if;
end $$;

alter table public.products
  add column if not exists category_id uuid references public.product_categories (id) on delete set null;

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'products'
               and column_name = 'category') then
    update public.products p
    set category_id = c.id
    from public.product_categories c
    where p.category = c.name and p.category_id is null;

    alter table public.products drop column category;
  end if;
end $$;

-- ============================================================
-- 2) status ('Live'/'Beta'/'Soon') → lifecycle ('live'/'beta'/'soon')
--    Guard on the CURRENT check-less 0002 shape: only rename when the values
--    are the 0002 vocabulary (i.e. this hasn't run yet).
-- ============================================================
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'products'
               and column_name = 'status')
     and not exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'products'
               and column_name = 'lifecycle') then
    alter table public.products rename column status to lifecycle;
  end if;
end $$;

update public.products set lifecycle = lower(lifecycle) where lifecycle <> lower(lifecycle);
alter table public.products alter column lifecycle set default 'live';
alter table public.products drop constraint if exists products_lifecycle_check;
alter table public.products
  add constraint products_lifecycle_check check (lifecycle in ('live', 'beta', 'soon'));
create index if not exists products_lifecycle_idx on public.products (lifecycle);

-- ============================================================
-- 3) published bool → status ('draft'/'published') + published_at
--    Order matters: backfill BEFORE the CHECK; swap the RLS policy BEFORE
--    dropping the old column it referenced.
-- ============================================================
alter table public.products add column if not exists published_at timestamptz;
alter table public.products add column if not exists status text;

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'products'
               and column_name = 'published') then
    update public.products
    set status = case when published then 'published' else 'draft' end
    where status is null;

    update public.products
    set published_at = coalesce(published_at, updated_at)
    where status = 'published';
  end if;
end $$;

update public.products set status = 'draft' where status is null;
alter table public.products alter column status set not null;
alter table public.products alter column status set default 'draft';
alter table public.products drop constraint if exists products_status_check;
alter table public.products
  add constraint products_status_check check (status in ('draft', 'published'));

drop policy if exists "products: public reads published" on public.products;
create policy "products: public reads published" on public.products
  for select to anon, authenticated
  using (status = 'published');

alter table public.products drop column if exists published;
create index if not exists products_status_idx on public.products (status);

-- ============================================================
-- 4) tags → tech
-- ============================================================
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'products'
               and column_name = 'tags')
     and not exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'products'
               and column_name = 'tech') then
    alter table public.products rename column tags to tech;
  end if;
end $$;

-- ============================================================
-- 5) New content columns + stable sort_order backfill (10, 20, 30 … by age)
-- ============================================================
alter table public.products add column if not exists tagline text;
alter table public.products add column if not exists highlights text[] not null default '{}';
alter table public.products add column if not exists technical_details text;
alter table public.products add column if not exists gallery text[] not null default '{}';
alter table public.products add column if not exists sort_order integer not null default 0;
alter table public.products add column if not exists seo_description text;
alter table public.products add column if not exists og_image text;

with numbered as (
  select id, row_number() over (order by created_at asc) as rn
  from public.products
  where sort_order = 0
)
update public.products p
set sort_order = (select coalesce(max(sort_order), 0) from public.products) + n.rn * 10
from numbered n
where p.id = n.id;

create index if not exists products_sort_order_idx on public.products (sort_order);
create index if not exists products_category_id_idx on public.products (category_id);

-- ============================================================
-- 6) product_features (image + explanation blocks, admin-ordered)
-- ============================================================
create table if not exists public.product_features (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  title text not null,
  description text,
  image text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_features enable row level security;
create index if not exists product_features_product_idx
  on public.product_features (product_id, sort_order);

drop policy if exists "features: public reads for published products" on public.product_features;
create policy "features: public reads for published products" on public.product_features
  for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'published'
  ));

drop policy if exists "features: admin reads all" on public.product_features;
create policy "features: admin reads all" on public.product_features
  for select to authenticated
  using (private.is_admin());

drop policy if exists "features: admin writes" on public.product_features;
create policy "features: admin writes" on public.product_features
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

grant select on public.product_features to anon, authenticated;
grant insert, update, delete on public.product_features to authenticated;

-- ============================================================
-- 7) product_blog_links (ordered many-to-many; both-sides-published for anon)
-- ============================================================
create table if not exists public.product_blog_links (
  product_id uuid not null references public.products (id) on delete cascade,
  blog_post_id uuid not null references public.blog_posts (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (product_id, blog_post_id)
);

alter table public.product_blog_links enable row level security;
create index if not exists product_blog_links_product_idx
  on public.product_blog_links (product_id);
create index if not exists product_blog_links_post_idx
  on public.product_blog_links (blog_post_id);

drop policy if exists "links: public reads published pairs" on public.product_blog_links;
create policy "links: public reads published pairs" on public.product_blog_links
  for select to anon, authenticated
  using (
    exists (select 1 from public.products p
            where p.id = product_id and p.status = 'published')
    and exists (select 1 from public.blog_posts b
                where b.id = blog_post_id and b.status = 'published')
  );

drop policy if exists "links: admin reads all" on public.product_blog_links;
create policy "links: admin reads all" on public.product_blog_links
  for select to authenticated
  using (private.is_admin());

drop policy if exists "links: admin writes" on public.product_blog_links;
create policy "links: admin writes" on public.product_blog_links
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

grant select on public.product_blog_links to anon, authenticated;
grant insert, update, delete on public.product_blog_links to authenticated;

-- ============================================================
-- 8) Security fix: only owners may change profiles.role (spec §5).
--    A trigger, not RLS — RLS cannot see WHICH column changed. Contexts with
--    no auth.uid() (SQL editor, service_role maintenance) stay allowed.
-- ============================================================
create or replace function private.is_owner()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'owner'
  );
$$;

revoke all on function private.is_owner() from public, anon;
grant execute on function private.is_owner() to authenticated;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not private.is_owner() then
    raise exception 'only owners can change roles';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();
