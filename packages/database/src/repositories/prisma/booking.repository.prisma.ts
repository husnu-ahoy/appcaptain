import type {
  BookingListQuery,
  CreateBookingInput,
} from "@ahoy/shared";
import { BookingStatus } from "@ahoy/shared";
import { Prisma } from "../../client.js";
import { prisma } from "../../client.js";
import type {
  ApproveBookingResult,
  BookingRepository,
  CreateBookingResult,
} from "../booking.repository.js";
import { toBookingDTO } from "../booking.repository.js";

/** Overlap test used everywhere: dates are inclusive, as in the original check. */
function overlapping(boatId: string, startDate: Date, endDate: Date) {
  return {
    boatId,
    AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
  } satisfies Prisma.BookingWhereInput;
}

/**
 * Serialises booking writes per boat: concurrent transactions for the same
 * boat wait here until the first one commits. Parameterised, no raw input.
 */
async function lockBoat(tx: Prisma.TransactionClient, boatId: string) {
  await tx.$queryRaw`SELECT "id" FROM "boats" WHERE "id" = ${boatId} FOR UPDATE`;
}

const includeBoat = {
  boat: {
    select: {
      id: true,
      title: true,
      photos: {
        where: { publicUrl: { not: null } },
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        take: 1,
        select: { publicUrl: true },
      },
    },
  },
} satisfies Prisma.BookingInclude;

const ACTIVE_STATUSES = [BookingStatus.PENDING, BookingStatus.APPROVED];

export class PrismaBookingRepository implements BookingRepository {
  async findConflict(boatId: string, startDate: Date, endDate: Date) {
    const row = await prisma.booking.findFirst({
      where: { ...overlapping(boatId, startDate, endDate), status: { in: ACTIVE_STATUSES } },
      select: { startDate: true, endDate: true },
    });
    return row ?? null;
  }

  async createIfAvailable(input: CreateBookingInput, captainId: string): Promise<CreateBookingResult> {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    return prisma.$transaction(async (tx) => {
      await lockBoat(tx, input.boatId);
      const clash = await tx.booking.findFirst({
        where: { ...overlapping(input.boatId, startDate, endDate), status: { in: ACTIVE_STATUSES } },
        select: { startDate: true, endDate: true },
      });
      if (clash) return { ok: false as const, conflict: clash };

      const row = await tx.booking.create({
        data: {
          boatId: input.boatId,
          captainId,
          guestName: input.guestName,
          guestEmail: input.guestEmail,
          guestPhone: input.guestPhone ?? null,
          guestCount: input.guestCount,
          rentalType: input.rentalType,
          startDate,
          endDate,
          startTime: input.startTime ?? null,
          endTime: input.endTime ?? null,
          message: input.message ?? null,
        },
        include: includeBoat,
      });
      return { ok: true as const, booking: toBookingDTO(row) };
    });
  }

  async getById(id: string) {
    const row = await prisma.booking.findUnique({
      where: { id },
      include: includeBoat,
    });
    return row ? toBookingDTO(row) : null;
  }

  async listByCaptain(captainId: string, query: BookingListQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const where: Record<string, unknown> = { captainId };
    if (query.status) where.status = query.status;

    const [rows, total, pendingCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: includeBoat,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
      prisma.booking.count({
        where: { captainId, status: BookingStatus.PENDING },
      }),
    ]);

    return {
      bookings: rows.map(toBookingDTO),
      total,
      page,
      limit,
      pendingCount,
    };
  }

  async approveIfPending(id: string, totalPrice?: number | null): Promise<ApproveBookingResult> {
    return prisma.$transaction(async (tx) => {
      const current = await tx.booking.findUnique({
        where: { id },
        select: { boatId: true, startDate: true, endDate: true },
      });
      if (!current) return { ok: false as const, reason: "not_found" as const };

      await lockBoat(tx, current.boatId);
      const clash = await tx.booking.findFirst({
        where: {
          ...overlapping(current.boatId, current.startDate, current.endDate),
          id: { not: id },
          status: BookingStatus.APPROVED,
        },
        select: { startDate: true, endDate: true },
      });
      if (clash) return { ok: false as const, reason: "conflict" as const, conflict: clash };

      // Conditional transition: a REJECTED/CANCELLED booking can no longer be approved.
      const { count } = await tx.booking.updateMany({
        where: { id, status: BookingStatus.PENDING },
        data: {
          status: BookingStatus.APPROVED,
          ...(totalPrice != null ? { totalPrice } : {}),
        },
      });
      if (count === 0) return { ok: false as const, reason: "not_pending" as const };

      const row = await tx.booking.findUniqueOrThrow({ where: { id }, include: includeBoat });
      return { ok: true as const, booking: toBookingDTO(row) };
    });
  }

  async rejectIfOpen(id: string, rejectionNote?: string | null) {
    // APPROVED stays rejectable: the captain panel uses "reject" to cancel an accepted request.
    const { count } = await prisma.booking.updateMany({
      where: { id, status: { in: ACTIVE_STATUSES } },
      data: { status: BookingStatus.REJECTED, rejectionNote: rejectionNote ?? null },
    });
    if (count === 0) return null;
    const row = await prisma.booking.findUniqueOrThrow({ where: { id }, include: includeBoat });
    return toBookingDTO(row);
  }

  async getBoatForBooking(boatId: string) {
    const boat = await prisma.boat.findUnique({
      where: { id: boatId },
      select: { ownerId: true, status: true },
    });
    return boat ? { ownerId: boat.ownerId, status: String(boat.status) } : null;
  }

  async getBoatCaptainId(boatId: string) {
    const boat = await prisma.boat.findUnique({
      where: { id: boatId },
      select: { ownerId: true },
    });
    return boat?.ownerId ?? null;
  }

  async listAvailability(boatId: string) {
    const rows = await prisma.booking.findMany({
      where: {
        boatId,
        status: { in: ACTIVE_STATUSES },
        endDate: { gte: new Date() },
      },
      select: { startDate: true, endDate: true, status: true },
      orderBy: { startDate: "asc" },
    });
    return rows.map((r) => ({
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      status: r.status as BookingStatus,
    }));
  }

  async listByGuestEmail(email: string) {
    const rows = await prisma.booking.findMany({
      where: { guestEmail: { equals: email, mode: "insensitive" } },
      include: includeBoat,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toBookingDTO);
  }
}
