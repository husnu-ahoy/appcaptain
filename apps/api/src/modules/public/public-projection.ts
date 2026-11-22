/**
 * Public read models for anonymous callers. The internal DTOs carry owner ids,
 * storage paths, review notes and contact details that must never leave the
 * API unauthenticated (docs/security-audit.md, SEC-16).
 */

function omit<T extends object, K extends PropertyKey>(obj: T, keys: readonly K[]): Omit<T, K> {
  const copy = { ...obj } as Record<PropertyKey, unknown>;
  for (const key of keys) delete copy[key];
  return copy as Omit<T, K>;
}

const PRIVATE_BOAT_FIELDS = ["ownerId", "rejectionReason"] as const;
const PRIVATE_EXPERIENCE_FIELDS = ["captainId", "captainEmail", "reviewNote", "emergencyContactPhone"] as const;

type PublicBoatInput = {
  photos: ReadonlyArray<object>;
  documents: ReadonlyArray<{ documentTypeKey: string; documentTypeLabel: string }>;
};

/** Boat detail without owner id, moderation notes, storage paths or document files. */
export function toPublicBoat<T extends PublicBoatInput>(boat: T) {
  return {
    ...omit(boat, PRIVATE_BOAT_FIELDS),
    photos: boat.photos.map((photo) => omit(photo, ["storagePath"] as const)),
    // The listing only shows which document types exist, never the files or review state.
    documents: boat.documents.map((d) => ({
      documentTypeKey: d.documentTypeKey,
      documentTypeLabel: d.documentTypeLabel,
    })),
  };
}

/** Experience detail without the captain's id, e-mail, review note or emergency phone. */
export function toPublicExperience<T extends object>(experience: T) {
  return omit(experience, PRIVATE_EXPERIENCE_FIELDS);
}

type ExperienceCardFields = {
  secondaryCategories?: readonly string[] | null;
  productType?: string | null;
  meetingPoint?: string | null;
  languages?: readonly string[] | null;
  minAge?: number | null;
  pickupOffered?: boolean | null;
  pricingType?: string | null;
  cancellationPolicy?: string | null;
  childDiscountPercent?: number | null;
};

/**
 * Public list item: the shared list DTO plus the few fields the web cards and
 * filters need (all of them are already public on the detail endpoint). Fields
 * are picked one by one so nothing private on the row can reach the list.
 */
export function toPublicExperienceListItem<T extends object>(item: T, row: ExperienceCardFields) {
  return {
    ...item,
    secondaryCategories: [...(row.secondaryCategories ?? [])],
    productType: row.productType ?? null,
    meetingPoint: row.meetingPoint ?? "",
    languages: [...(row.languages ?? [])],
    minAge: row.minAge ?? null,
    pickupOffered: row.pickupOffered ?? false,
    pricingType: row.pricingType ?? null,
    cancellationPolicy: row.cancellationPolicy ?? null,
    childDiscountPercent: row.childDiscountPercent ?? null,
  };
}
