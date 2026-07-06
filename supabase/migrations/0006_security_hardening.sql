-- NurvexThink — 0006: security hardening (Supabase advisor sweep, 2026-07-06).
-- Applied to the live project via MCP the same day; kept here so the repo
-- mirrors the database. Idempotent.

-- Trigger functions must not be RPC-callable (/rest/v1/rpc/...).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;

-- Pin search_path on the updated_at trigger helper (mutable-search-path lint).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Accepted advisor findings, for the record:
--  * "orders: public can insert" WITH CHECK (true) is intentional — the public
--    lead form inserts; table CHECK constraints validate the payload.
--  * "Leaked password protection disabled" is a Dashboard toggle
--    (Auth → Providers → Password), not a SQL setting — enable it there.
