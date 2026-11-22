import { z } from "zod";
import { RentalType } from "../enums";

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Saat formatı HH:MM olmalı");

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Upper bounds for an anonymous booking request. PENDING requests block the
 * calendar, so an unbounded range would let a single request lock a boat for
 * years (see docs/security-audit.md, SEC-07).
 */
export const BOOKING_MAX_SPAN_DAYS = 90;
export const BOOKING_MAX_ADVANCE_DAYS = 730;

/** Public booking request payload (guest — no account required). */
export const createBookingSchema = z
  .object({
    boatId: z.string().min(1, "Tekne seçilmeli"),
    guestName: z.string().trim().min(2, "Ad Soyad en az 2 karakter olmalı").max(120),
    guestEmail: z.string().trim().email("Geçerli bir e-posta girin"),
    guestPhone: z.string().trim().max(40).optional().nullable(),
    guestCount: z
      .number({ invalid_type_error: "Misafir sayısı gerekli" })
      .int()
      .positive("En az 1 misafir olmalı")
      .max(500, "Misafir sayısı çok yüksek"),
    rentalType: z.nativeEnum(RentalType),
    startDate: z.string().datetime({ offset: true }).or(z.string().min(1)),
    endDate: z.string().datetime({ offset: true }).or(z.string().min(1)),
    startTime: timeString.optional().nullable(),
    endTime: timeString.optional().nullable(),
    message: z.string().trim().max(1000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "Geçerli bir başlangıç tarihi seçin",
      });
    }
    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Geçerli bir bitiş tarihi seçin",
      });
    }
    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end < start
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Bitiş tarihi başlangıçtan önce olamaz",
      });
    }
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

    // Dates arrive as UTC midnights; two days of slack keep "today" bookable in every time zone.
    const now = Date.now();
    if (start.getTime() < now - 2 * DAY_MS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "Geçmiş bir tarih seçilemez",
      });
    }
    if (start.getTime() > now + BOOKING_MAX_ADVANCE_DAYS * DAY_MS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "En fazla 2 yıl sonrası için talep gönderebilirsin",
      });
    }
    if (end.getTime() - start.getTime() > BOOKING_MAX_SPAN_DAYS * DAY_MS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: `Tek talepte en fazla ${BOOKING_MAX_SPAN_DAYS} gün seçebilirsin`,
      });
    }
  });

export const approveBookingSchema = z.object({
  totalPrice: z.number().positive().optional().nullable(),
});

export const rejectBookingSchema = z.object({
  rejectionNote: z.string().trim().max(500).optional().nullable(),
});
