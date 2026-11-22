import type {
  BookingListQuery,
  CreateBookingInput,
} from "@ahoy/shared";
import { BoatStatus, PLATFORM_COMMISSION_RATE } from "@ahoy/shared";
import {
  bookingPaymentRepository,
  bookingRepository,
  guestConversationRepository,
} from "@ahoy/database";
import { conflict, forbidden, notFound } from "../../../lib/errors.js";

const fmtDay = (d: Date) => d.toISOString().slice(0, 10);

export async function createBooking(input: CreateBookingInput) {
  // Only published listings take requests; drafts, suspended and rejected boats look missing.
  const boat = await bookingRepository.getBoatForBooking(input.boatId);
  if (!boat || boat.status !== BoatStatus.ACTIVE) throw notFound("Tekne bulunamadı");
  const captainId = boat.ownerId;

  const result = await bookingRepository.createIfAvailable(input, captainId);
  if (!result.ok) {
    throw conflict(
      `Bu tarihler için zaten bir rezervasyon var (${fmtDay(result.conflict.startDate)} → ${fmtDay(result.conflict.endDate)}).`
    );
  }
  const booking = result.booking;

  // Best-effort: open a guest conversation seeded from the request note so the
  // captain can reply. A messaging failure must not fail the booking itself.
  try {
    await guestConversationRepository.getOrCreateForBooking({
      bookingId: booking.id,
      captainId,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      boatId: booking.boatId,
      initialMessage: booking.message ?? null,
    });
  } catch {
    /* ignore — conversation can be created later */
  }

  return booking;
}

export function getAvailability(boatId: string) {
  return bookingRepository.listAvailability(boatId);
}

export function listCaptainBookings(captainId: string, query: BookingListQuery) {
  return bookingRepository.listByCaptain(captainId, query);
}

export async function listByCustomerEmail(email: string | null) {
  if (!email) return { items: [] };
  const items = await bookingRepository.listByGuestEmail(email);
  return { items };
}

async function loadOwnedBooking(id: string, captainId: string) {
  const booking = await bookingRepository.getById(id);
  if (!booking) throw notFound("Rezervasyon bulunamadı");
  if (booking.captainId !== captainId) {
    throw forbidden("Bu rezervasyona erişim yetkiniz yok");
  }
  return booking;
}

export async function approveBooking(
  id: string,
  captainId: string,
  totalPrice?: number | null
) {
  await loadOwnedBooking(id, captainId);
  const result = await bookingRepository.approveIfPending(id, totalPrice);
  if (!result.ok) {
    if (result.reason === "not_found") throw notFound("Rezervasyon bulunamadı");
    if (result.reason === "not_pending") {
      throw conflict("Yalnızca bekleyen talepler onaylanabilir");
    }
    throw conflict(
      `Bu tarihlerde onaylanmış başka bir rezervasyon var (${fmtDay(result.conflict.startDate)} → ${fmtDay(result.conflict.endDate)}).`
    );
  }
  const booking = result.booking;

  // Best-effort: open a PENDING payment record (gross - 15% commission) so the
  // captain sees expected earnings. Skipped when no amount is known yet.
  try {
    const amount = booking.totalPrice ?? 0;
    if (amount > 0 && !(await bookingPaymentRepository.existsForBooking(id))) {
      const commission = Math.round(amount * PLATFORM_COMMISSION_RATE * 100) / 100;
      await bookingPaymentRepository.create({
        bookingId: id,
        captainId: booking.captainId,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        boatName: booking.boat?.name ?? "İsimsiz tekne",
        amount,
        commission,
        netAmount: Math.round((amount - commission) * 100) / 100,
        currency: booking.currency,
      });
    }
  } catch {
    /* ignore — payment can be reconciled later */
  }

  return booking;
}

export async function rejectBooking(
  id: string,
  captainId: string,
  rejectionNote?: string | null
) {
  await loadOwnedBooking(id, captainId);
  const booking = await bookingRepository.rejectIfOpen(id, rejectionNote);
  if (!booking) throw conflict("Bu rezervasyon artık değiştirilemez");
  return booking;
}
