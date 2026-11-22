-- =====================================================================
-- 001: Lock down the Supabase Data API (PostgREST) for schema public.
--
-- WHY
--   The apps never read tables through PostgREST: there is no supabase.from()
--   or .rpc() anywhere; every read and write goes through the Fastify API,
--   which connects with Prisma as the table owner. Supabase nevertheless gives
--   the anon and authenticated roles full privileges on new tables in public,
--   and the anon key ships in the web and captain bundles. Without this script,
--   anyone holding that key can read or write tables such as admin_users,
--   refresh_tokens, bookings and system_settings directly
--   (docs/security-audit.md: SEC-01, SEC-02).
--
-- WHAT
--   1. Revoke every table, sequence and function privilege of anon/authenticated in public.
--   2. Stop future tables (prisma db push) from inheriting those privileges.
--   3. Enable RLS on every table as a second, deny-all layer (no policies).
--   4. Drop the auth.uid()-based policies and the SECURITY DEFINER is_admin()
--      helper from supabase-policies.sql; they let any Supabase-Auth customer
--      write their own ADMIN profile row.
--
-- SAFE FOR THE APP
--   Prisma connects as postgres, the owner of these tables. Owners bypass RLS
--   unless it is FORCED, and this script does not force it. Confirm the owner
--   first with query Q1 in docs/database-schema.md.
--
-- HOW TO RUN
--   Not applied by any build or deploy step. Review it, take a backup or check
--   that PITR is available, then run it once in the Supabase SQL editor. It is
--   idempotent. Rollback: 001_lock_down_data_api.down.sql.
-- =====================================================================
begin;

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;

do $$
declare t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  loop
    execute format('alter table public.%I enable row level security', t.relname);
  end loop;
end $$;

-- Policies created by supabase-policies.sql (writes for any auth.uid(), public read of boats).
drop policy if exists profiles_self on public.profiles;
drop policy if exists boats_owner_all on public.boats;
drop policy if exists boats_public_read on public.boats;
do $$
declare t text;
begin
  foreach t in array array[
    'boat_listing_models', 'boat_feature_values', 'boat_amenities',
    'boat_photos', 'boat_pricing', 'boat_seasonal_prices', 'boat_extras', 'boat_documents'
  ]
  loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
    end if;
  end loop;
end $$;
drop function if exists public.is_admin();

commit;
