-- =====================================================================
-- Supabase-specific setup that Prisma does not manage: storage buckets.
-- Idempotent: safe to re-run. Applied by hand (no build or deploy runs it).
--
-- Data API access is handled by security/001_lock_down_data_api.sql. No app
-- reads tables through PostgREST, so anon and authenticated get no privileges
-- and every table has deny-all RLS.
--
-- The earlier auth.uid() policies and the SECURITY DEFINER is_admin() helper
-- were removed on purpose. Captains and admins do not use Supabase Auth, so
-- those policies protected nothing, and profiles_self let any Supabase-Auth
-- customer write their own ADMIN profile (docs/security-audit.md, SEC-02).
-- The previous version is kept in test/fixtures/supabase-policies.before-001.sql.
-- =====================================================================

-- Storage buckets: photos public, documents private.
INSERT INTO storage.buckets (id, name, public)
VALUES ('boat-photos', 'boat-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('boat-documents', 'boat-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Experience photos are served through public URLs (experience.service.ts).
INSERT INTO storage.buckets (id, name, public)
VALUES ('experience-photo', 'experience-photo', true)
ON CONFLICT (id) DO NOTHING;
