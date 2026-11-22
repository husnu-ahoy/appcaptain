import type {
  BookingBlockedRange,
  BookingDTO,
  BookingListQuery,
  BookingListResponse,
  BookingStatus,
  CreateBookingInput,
} from "@ahoy/shared";

export interface BookingRepository {
  /** Returns the existing overlapping PENDING/APPROVED booking, if any. */
  findConflict(
    boatId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ startDate: Date; endDate: Date } | null>;
  /**
   * Creates the booking only if no PENDING/APPROVED booking overlaps. The check
   * and the insert run in one transaction that locks the boat row, so two
   * concurrent requests for the same dates cannot both succeed.
   */
  createIfAvailable(input: CreateBookingInput, captainId: string): Promise<CreateBookingResult>;
  getById(id: string): Promise<BookingDTO | null>;
  /** Captain's incoming requests, scoped by captainId. */
  listByCaptain(
    captainId: string,
    query: BookingListQuery
  ): Promise<BookingListResponse>;
  /** PENDING → APPROVED, refused if another APPROVED booking overlaps (boat row locked). */
  approveIfPending(id: string, totalPrice?: number | null): Promise<ApproveBookingResult>;
  /** PENDING/APPROVED → REJECTED; returns null when the booking is already closed. */
  rejectIfOpen(id: string, rejectionNote?: string | null): Promise<BookingDTO | null>;
  /** Boat owner (Profile id) — used to scope captain access. */
  getBoatCaptainId(boatId: string): Promise<string | null>;
  /** Owner and listing status, used to refuse bookings on non-ACTIVE boats. */
  getBoatForBooking(boatId: string): Promise<{ ownerId: string; status: string } | null>;
  /** Future busy ranges for availability calendars. */
  listAvailability(boatId: string): Promise<BookingBlockedRange[]>;
  /** Logged-in customer's own bookings — matched by account email (no customerId column exists). */
  listByGuestEmail(email: string): Promise<BookingDTO[]>;
}

export type BookingRange = { startDate: Date; endDate: Date };

export type CreateBookingResult =
  | { ok: true; booking: BookingDTO }
  | { ok: false; conflict: BookingRange };

export type ApproveBookingResult =
  | { ok: true; booking: BookingDTO }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "not_pending" }
  | { ok: false; reason: "conflict"; conflict: BookingRange };

export interface BookingRow {
  id: string;
  boatId: string;
  captainId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  guestCount: number;
  rentalType: string;
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
  totalPrice: number | null;
  currency: string;
  message: string | null;
  status: string;
  rejectionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  boat?: {
    id: string;
    title: string | null;
    photos?: { publicUrl: string | null }[];
  } | null;
}

export function toBookingDTO(row: BookingRow): BookingDTO {
  return {
    id: row.id,
    boatId: row.boatId,
    captainId: row.captainId,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    guestPhone: row.guestPhone,
    guestCount: row.guestCount,
    rentalType: row.rentalType as BookingDTO["rentalType"],
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    startTime: row.startTime,
    endTime: row.endTime,
    totalPrice: row.totalPrice,
    currency: row.currency,
    message: row.message,
    status: row.status as BookingStatus,
    rejectionNote: row.rejectionNote,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    boat: row.boat
      ? {
          id: row.boat.id,
          name: row.boat.title?.trim() || "İsimsiz tekne",
          coverPhoto: row.boat.photos?.[0]?.publicUrl ?? null,
        }
      : null,
  };
}
