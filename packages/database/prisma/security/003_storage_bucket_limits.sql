-- =====================================================================
-- 003 (proposal): size and type limits on the storage buckets.
--
-- Signed upload URLs currently accept any file type and size, including
-- HTML and SVG in the public boat-photos bucket (docs/security-audit.md,
-- SEC-32). Supabase enforces these limits on upload, so no API change is needed.
--
-- PRODUCT CHECK BEFORE RUNNING: confirm the limits and formats below match what
-- captains upload (iPhone HEIC photos, scanned PDFs). Existing files are not
-- touched. Rollback: set file_size_limit and allowed_mime_types back to null.
-- =====================================================================
-- boat-photos also holds the boat plan, which the wizard accepts as an image or PDF.
UPDATE storage.buckets
SET file_size_limit = 15 * 1024 * 1024,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
                               'image/heic', 'image/heif', 'application/pdf']
WHERE id = 'boat-photos';

UPDATE storage.buckets
SET file_size_limit = 15 * 1024 * 1024,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
                               'image/heic', 'image/heif']
WHERE id = 'experience-photo';

UPDATE storage.buckets
SET file_size_limit = 20 * 1024 * 1024,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif']
WHERE id = 'boat-documents';
