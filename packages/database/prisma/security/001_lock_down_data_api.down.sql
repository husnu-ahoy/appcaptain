-- =====================================================================
-- Rollback for 001_lock_down_data_api.sql.
--
-- WARNING: this re-opens the Data API. The public anon key can then read and
-- write every table in schema public again (Supabase's default grants). Use it
-- only to undo an outage caused by 001, and re-apply 001 as soon as possible.
-- RLS stays enabled; re-run supabase-policies.sql if its policies are needed.
-- =====================================================================
begin;

grant all on all tables    in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all functions in schema public to anon, authenticated;

alter default privileges for role postgres in schema public grant all on tables    to anon, authenticated;
alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated;
alter default privileges for role postgres in schema public grant all on functions to anon, authenticated;

commit;
