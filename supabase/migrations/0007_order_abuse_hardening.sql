-- NurvexThink — 0007: order-form abuse hardening (additive; safe to apply before
-- the app deploy). Adds a per-IP rate-limit table and tidies a leftover grant.

-- Per-IP submission log for rate limiting. Stores a SALTED HASH of the IP, never
-- the raw address. Written only by the server action via the service role.
create table if not exists public.order_rate_limit (
  ip_hash    text        not null,
  created_at timestamptz not null default now()
);
create index if not exists order_rate_limit_ip_time_idx
  on public.order_rate_limit (ip_hash, created_at);

-- Default-deny: RLS on, no policies -> anon/authenticated get nothing; the
-- service role bypasses RLS, so only the server action can read/write it.
alter table public.order_rate_limit enable row level security;

-- Consistency with 0006: the updated_at trigger helper never needs to be
-- callable from the REST/RPC surface.
revoke execute on function public.set_updated_at() from public, anon, authenticated;

select 'ok' as status;
