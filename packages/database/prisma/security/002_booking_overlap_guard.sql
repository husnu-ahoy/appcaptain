-- =====================================================================
-- 002 (proposal): database-enforced protection against double bookings.
--
-- The API already serialises booking creation and approval per boat with a
-- row lock (booking.repository.prisma.ts). This constraint is the second
-- layer: Postgres itself refuses a second APPROVED booking that overlaps an
-- existing one for the same boat, whatever code path writes it. Dates are
-- inclusive ('[]'), matching the API's overlap check.
--
-- BEFORE RUNNING: the statement fails if APPROVED bookings already overlap.
-- List them first and resolve them with the captains:
--
--   select a.id, b.id, a."boatId", a."startDate", a."endDate", b."startDate", b."endDate"
--   from public.bookings a join public.bookings b
--     on a."boatId" = b."boatId" and a.id < b.id
--    and a.status = 'APPROVED' and b.status = 'APPROVED'
--    and tsrange(a."startDate", a."endDate", '[]') && tsrange(b."startDate", b."endDate", '[]');
--
-- Not applied by any build. Rollback:
--   alter table public.bookings drop constraint if exists bookings_no_overlapping_approved;
-- Note: `prisma db push` drops constraints it does not know about. Re-apply
-- this file after every db push until the schema moves to migrations
-- (docs/backend-roadmap.md, C-2).
-- =====================================================================
create extension if not exists btree_gist;

alter table public.bookings
  drop constraint if exists bookings_no_overlapping_approved;

alter table public.bookings
  add constraint bookings_no_overlapping_approved
  exclude using gist (
    "boatId" with =,
    tsrange("startDate", "endDate", '[]') with &&
  )
  where (status = 'APPROVED');
