import { test } from "node:test";
import assert from "node:assert/strict";
import { BOOKING_MAX_SPAN_DAYS, createBookingSchema } from "@ahoy/shared";

const DAY = 24 * 60 * 60 * 1000;
const day = (offset: number) => new Date(Date.now() + offset * DAY).toISOString().slice(0, 10);

const base = {
  boatId: "boat_1",
  guestName: "Ayşe Yılmaz",
  guestEmail: "ayse@example.com",
  guestCount: 4,
  rentalType: "DAILY",
};

const issues = (input: object) => {
  const r = createBookingSchema.safeParse({ ...base, ...input });
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
};

test("accepts a normal request for next week", () => {
  assert.deepEqual(issues({ startDate: day(7), endDate: day(9) }), []);
});

test("still accepts 'today' (UTC midnight) for guests ahead of UTC", () => {
  assert.deepEqual(issues({ startDate: day(0), endDate: day(1) }), []);
});

test("rejects dates in the past", () => {
  assert.match(issues({ startDate: day(-10), endDate: day(-8) }).join("\n"), /startDate: Geçmiş/);
});

test("rejects a single request that would lock the calendar for years", () => {
  assert.match(issues({ startDate: day(1), endDate: "2099-12-31" }).join("\n"), /endDate: Tek talepte/);
  assert.deepEqual(issues({ startDate: day(1), endDate: day(1 + BOOKING_MAX_SPAN_DAYS) }), []);
});

test("rejects requests further than two years ahead", () => {
  assert.match(issues({ startDate: day(800), endDate: day(802) }).join("\n"), /startDate: En fazla 2 yıl/);
});

test("rejects end before start and absurd guest counts", () => {
  assert.match(issues({ startDate: day(5), endDate: day(3) }).join("\n"), /endDate: Bitiş/);
  assert.match(issues({ startDate: day(5), endDate: day(6), guestCount: 10_000 }).join("\n"), /guestCount/);
});
