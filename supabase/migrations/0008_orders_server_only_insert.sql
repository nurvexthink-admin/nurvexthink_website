-- NurvexThink — 0008: close the direct anonymous write path to `orders`.
--
-- ⚠️ APPLY ONLY AFTER the app deploy that switches the order server action to
-- the service-role client (feat/order-abuse-hardening). Before that deploy the
-- live form still inserts as anon and needs this policy; removing it early would
-- break lead submissions.
--
-- After this, the ONLY way to create a lead is the verified server action
-- (Turnstile + rate limit + service role). A bot POSTing straight to
-- /rest/v1/orders with the public anon key is rejected by RLS.

drop policy if exists "orders: public can insert" on public.orders;

-- Verify: anon/authenticated should have NO insert policy left on orders.
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'orders'
order by policyname;
