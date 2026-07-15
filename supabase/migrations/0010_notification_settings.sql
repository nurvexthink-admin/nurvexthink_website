-- NurvexThink — 0010: admin-editable recipients for the "new lead" alert email.
-- Additive and idempotent.
--
-- The customer's confirmation always goes to the customer. THIS controls only the
-- internal alert ("new project request") — who on the team gets notified. It is
-- never shown to the customer. Editable from the admin panel (Leads page).

create table if not exists public.notification_settings (
  id              smallint primary key default 1,
  -- Empty array => the order action falls back to the EMAIL_TO env var.
  lead_recipients text[]      not null default '{}',
  updated_at      timestamptz not null default now(),
  constraint notification_settings_singleton check (id = 1)
);

alter table public.notification_settings enable row level security;

drop trigger if exists notification_settings_set_updated_at on public.notification_settings;
create trigger notification_settings_set_updated_at
  before update on public.notification_settings
  for each row execute function public.set_updated_at();

-- Admin-only. Read with the service role from the order action; edited by the
-- logged-in admin. anon gets nothing.
drop policy if exists "notification_settings: admin reads" on public.notification_settings;
create policy "notification_settings: admin reads" on public.notification_settings
  for select to authenticated
  using (private.is_admin());

drop policy if exists "notification_settings: admin writes" on public.notification_settings;
create policy "notification_settings: admin writes" on public.notification_settings
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

grant select, insert, update on public.notification_settings to authenticated;

-- Seed the singleton with the current default recipient.
insert into public.notification_settings (id, lead_recipients)
values (1, array['nth@nurvexthink.com'])
on conflict (id) do nothing;
