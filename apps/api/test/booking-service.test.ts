import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { bookingPaymentRepository, bookingRepository, guestConversationRepository } from "@ahoy/database";
import { approveBooking, createBooking, rejectBooking } from "../src/modules/bookings/services/booking.service.ts";

/** Repository calls are replaced per test; nothing here reaches a database. */
type Stubbed = Record<string, (...args: never[]) => unknown>;
const repo = bookingRepository as unknown as Stubbed;
const calls: string[] = [];

const booking = (over: Partial<Record<string, unknown>> = {}) => ({
  id: "bk_1",
  boatId: "boat_1",
  captainId: "cap_1",
  guestName: "Ayşe",
  guestEmail: "ayse@example.com",
  status: "PENDING",
  totalPrice: null,
  currency: "EUR",
  startDate: "2030-06-01T00:00:00.000Z",
  endDate: "2030-06-03T00:00:00.000Z",
  boat: { name: "Bavaria" },
  ...over,
});

const input = {
  boatId: "boat_1",
  guestName: "Ayşe",
  guestEmail: "ayse@example.com",
  guestCount: 2,
  rentalType: "DAILY",
  startDate: "2030-06-01",
  endDate: "2030-06-03",
} as Parameters<typeof createBooking>[0];

beforeEach(() => {
  calls.length = 0;
  repo.getBoatForBooking = async () => ({ ownerId: "cap_1", status: "ACTIVE" });
  repo.createIfAvailable = async () => ({ ok: true, booking: booking() });
  repo.getById = async () => booking();
  (guestConversationRepository as unknown as Stubbed).getOrCreateForBooking = async () => {
    calls.push("conversation");
    return {};
  };
  const payments = bookingPaymentRepository as unknown as Stubbed;
  payments.existsForBooking = async () => false;
  payments.create = async () => {
    calls.push("payment");
    return {};
  };
});

const status = async (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: { statusCode?: number }) => e.statusCode ?? 500
  );

test("bookings for a non-ACTIVE listing are refused as not found", async () => {
  for (const s of ["DRAFT", "PENDING_REVIEW", "SUSPENDED", "REJECTED"]) {
    repo.getBoatForBooking = async () => ({ ownerId: "cap_1", status: s });
    assert.equal(await status(createBooking(input)), 404, s);
  }
  repo.getBoatForBooking = async () => null;
  assert.equal(await status(createBooking(input)), 404);
});

test("the captain id comes from the boat, never from the request", async () => {
  let usedCaptain = "";
  repo.createIfAvailable = async (_i: never, captainId: never) => {
    usedCaptain = captainId;
    return { ok: true, booking: booking() };
  };
  await createBooking({ ...input, captainId: "attacker" } as typeof input);
  assert.equal(usedCaptain, "cap_1");
});

test("an overlapping request is a 409 and opens no conversation", async () => {
  repo.createIfAvailable = async () => ({
    ok: false,
    conflict: { startDate: new Date("2030-06-02"), endDate: new Date("2030-06-04") },
  });
  assert.equal(await status(createBooking(input)), 409);
  assert.deepEqual(calls, []);
});

test("approve only works on PENDING requests", async () => {
  repo.approveIfPending = async () => ({ ok: false, reason: "not_pending" });
  assert.equal(await status(approveBooking("bk_1", "cap_1", 1000)), 409);
  assert.deepEqual(calls, [], "no payment row for a refused approval");
});

test("approve is refused when another APPROVED booking overlaps", async () => {
  repo.approveIfPending = async () => ({
    ok: false,
    reason: "conflict",
    conflict: { startDate: new Date("2030-06-01"), endDate: new Date("2030-06-02") },
  });
  assert.equal(await status(approveBooking("bk_1", "cap_1", 1000)), 409);
});

test("a successful approval records the expected payment", async () => {
  repo.approveIfPending = async () => ({ ok: true, booking: booking({ status: "APPROVED", totalPrice: 1000 }) });
  assert.equal(await status(approveBooking("bk_1", "cap_1", 1000)), 200);
  assert.deepEqual(calls, ["payment"]);
});

test("another captain cannot approve or reject the booking", async () => {
  repo.approveIfPending = async () => assert.fail("must not reach the repository");
  repo.rejectIfOpen = async () => assert.fail("must not reach the repository");
  assert.equal(await status(approveBooking("bk_1", "cap_2", 1000)), 403);
  assert.equal(await status(rejectBooking("bk_1", "cap_2", null)), 403);
});

test("rejecting an already closed booking is a 409", async () => {
  repo.rejectIfOpen = async () => null;
  assert.equal(await status(rejectBooking("bk_1", "cap_1", "dolu")), 409);
});
