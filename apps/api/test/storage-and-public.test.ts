import { test } from "node:test";
import assert from "node:assert/strict";
import {
  boatFolder,
  boatPlanFolder,
  documentFolder,
  isOwnedStoragePath,
} from "../src/modules/boat-onboarding/storage-paths.ts";
import { toPublicBoat, toPublicExperience, toPublicExperienceListItem } from "../src/modules/public/public-projection.ts";

test("storage paths must stay inside the boat's own folder", () => {
  assert.equal(isOwnedStoragePath("boat_1/uuid-photo.jpg", boatFolder("boat_1")), true);
  assert.equal(isOwnedStoragePath("boat_1/boat-plan/uuid-plan.png", boatPlanFolder("boat_1")), true);
  assert.equal(isOwnedStoragePath("boat_1/LICENSE/uuid-a.pdf", documentFolder("boat_1", "LICENSE")), true);

  for (const bad of [
    "boat_2/uuid-photo.jpg", // another boat (the API-4 attack)
    "boat_10/uuid-photo.jpg", // prefix lookalike
    "boat_1/../boat_2/uuid.jpg",
    "boat_1//uuid.jpg",
    "boat_1/",
    "/boat_1/uuid.jpg",
    "boat_1\\..\\boat_2\\x.jpg",
  ]) {
    assert.equal(isOwnedStoragePath(bad, boatFolder("boat_1")), false, bad);
  }
  assert.equal(isOwnedStoragePath("boat_1/uuid.jpg", boatPlanFolder("boat_1")), false);
  assert.equal(isOwnedStoragePath("boat_1/OTHER/uuid.pdf", documentFolder("boat_1", "LICENSE")), false);
});

test("public boat detail hides owner id, storage paths, moderation notes and document files", () => {
  const internal = {
    id: "boat_1",
    title: "Bavaria",
    status: "ACTIVE",
    ownerId: "cap_1",
    rejectionReason: "eksik belge",
    photos: [{ id: "p1", publicUrl: "https://x/p1.jpg", storagePath: "boat_1/p1.jpg", isCover: true }],
    documents: [
      {
        id: "d1",
        documentTypeKey: "LICENSE",
        documentTypeLabel: "Ruhsat",
        fileName: "ruhsat-ahmet-yilmaz.pdf",
        status: "REJECTED",
        publicUrl: null,
        rejectionReason: "okunmuyor",
      },
    ],
  };
  const out = toPublicBoat(internal);
  const json = JSON.stringify(out);
  for (const secret of ["cap_1", "eksik belge", "boat_1/p1.jpg", "ruhsat-ahmet", "okunmuyor"]) {
    assert.equal(json.includes(secret), false, secret);
  }
  assert.deepEqual(out.documents, [{ documentTypeKey: "LICENSE", documentTypeLabel: "Ruhsat" }]);
  assert.equal(out.photos[0]?.publicUrl, "https://x/p1.jpg");
  assert.equal(out.title, "Bavaria");
});

test("public experience detail hides the captain's id, e-mail, review note and emergency phone", () => {
  const out = toPublicExperience({
    id: "e1",
    title: "Gün batımı",
    captainId: "cap_1",
    captainName: "Mehmet",
    captainEmail: "mehmet@example.com",
    reviewNote: "fiyat yüksek",
    emergencyContactPhone: "+90 555 000 00 00",
  });
  assert.deepEqual(out, { id: "e1", title: "Gün batımı", captainName: "Mehmet" });
});

test("public experience list item adds the card fields and nothing private from the row", () => {
  const row = {
    id: "e1",
    captainId: "cap_1",
    reviewNote: "fiyat yüksek",
    emergencyContactPhone: "+90 555 000 00 00",
    secondaryCategories: ["BOAT_TOUR"],
    productType: "TOUR",
    meetingPoint: "Bodrum Marina, Bodrum",
    languages: ["Türkçe", "İngilizce"],
    minAge: 6,
    pickupOffered: true,
    pricingType: "PER_PERSON",
    cancellationPolicy: "FREE_24H",
    childDiscountPercent: 30,
  };
  const out = toPublicExperienceListItem({ id: "e1", title: "Gün batımı" }, row);
  assert.deepEqual(out, {
    id: "e1",
    title: "Gün batımı",
    secondaryCategories: ["BOAT_TOUR"],
    productType: "TOUR",
    meetingPoint: "Bodrum Marina, Bodrum",
    languages: ["Türkçe", "İngilizce"],
    minAge: 6,
    pickupOffered: true,
    pricingType: "PER_PERSON",
    cancellationPolicy: "FREE_24H",
    childDiscountPercent: 30,
  });
});

test("public experience list item fills safe defaults when the row lacks card fields", () => {
  const out = toPublicExperienceListItem({ id: "e2" }, {});
  assert.deepEqual(out, {
    id: "e2",
    secondaryCategories: [],
    productType: null,
    meetingPoint: "",
    languages: [],
    minAge: null,
    pickupOffered: false,
    pricingType: null,
    cancellationPolicy: null,
    childDiscountPercent: null,
  });
});
