import { before, test } from "node:test";
import assert from "node:assert/strict";
import type { PGlite } from "@electric-sql/pglite";
import { createSupabaseLikeDb, outcome, sqlFile } from "./supabase-sandbox.ts";

let db: PGlite;
let n = 0;

before(async () => {
  db = await createSupabaseLikeDb();
  await db.exec(`
    insert into public.profiles (id, email, "passwordHash", "updatedAt")
      values ('00000000-0000-0000-0000-000000000001', 'cap@example.com', 'x', now());
    insert into public.boats (id, "ownerId", "updatedAt")
      values ('boat_1', '00000000-0000-0000-0000-000000000001', now()),
             ('boat_2', '00000000-0000-0000-0000-000000000001', now());
  `);
  await db.exec(sqlFile("security/002_booking_overlap_guard.sql"));
});

const book = (boat: string, start: string, end: string, status: string) =>
  outcome(
    db,
    `insert into public.bookings (id, "boatId", "captainId", "guestName", "guestEmail", "guestCount",
       "rentalType", "startDate", "endDate", status, "updatedAt")
     values ('bk_${++n}', '${boat}', '00000000-0000-0000-0000-000000000001', 'G', 'g@example.com', 2,
       'DAILY', '${start}', '${end}', '${status}', now())`
  );

test("a second APPROVED booking overlapping the first is refused by Postgres", async () => {
  assert.equal(await book("boat_1", "2030-06-01", "2030-06-05", "APPROVED"), "ok");
  assert.equal(await book("boat_1", "2030-06-04", "2030-06-08", "APPROVED"), "23P01");
  // inclusive end date, as in the API's overlap check: the changeover day counts
  assert.equal(await book("boat_1", "2030-06-05", "2030-06-06", "APPROVED"), "23P01");
});

test("non-overlapping dates, other boats and non-APPROVED rows are unaffected", async () => {
  assert.equal(await book("boat_1", "2030-06-06", "2030-06-08", "APPROVED"), "ok");
  assert.equal(await book("boat_2", "2030-06-01", "2030-06-05", "APPROVED"), "ok");
  assert.equal(await book("boat_1", "2030-06-02", "2030-06-03", "PENDING"), "ok");
  assert.equal(await book("boat_1", "2030-06-02", "2030-06-03", "REJECTED"), "ok");
});

test("turning an overlapping PENDING request into APPROVED is refused too", async () => {
  assert.equal(await book("boat_1", "2030-06-03", "2030-06-04", "PENDING"), "ok");
  assert.equal(await outcome(db, `update public.bookings set status = 'APPROVED' where id = 'bk_${n}'`), "23P01");
});
