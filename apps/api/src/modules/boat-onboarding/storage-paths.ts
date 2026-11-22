import { badRequest } from "../../lib/errors.js";

/**
 * Upload paths are minted by the API (`${boatId}/…`), but the register step
 * receives them back from the browser. Only paths inside the boat's own folder
 * are accepted, so a captain cannot attach another boat's object and later
 * delete it with the service-role key (docs/security-audit.md, SEC-08).
 */
export function isOwnedStoragePath(storagePath: string, prefix: string): boolean {
  if (!prefix.endsWith("/") || !storagePath.startsWith(prefix)) return false;
  if (storagePath.length === prefix.length || storagePath.includes("\\")) return false;
  return !storagePath.split("/").some((segment) => segment === "" || segment === "." || segment === "..");
}

export function assertOwnedStoragePath(storagePath: string, prefix: string): void {
  if (!isOwnedStoragePath(storagePath, prefix)) throw badRequest("Geçersiz dosya yolu");
}

export const boatFolder = (boatId: string) => `${boatId}/`;
export const boatPlanFolder = (boatId: string) => `${boatId}/boat-plan/`;
export const documentFolder = (boatId: string, documentTypeKey: string) => `${boatId}/${documentTypeKey}/`;
