import { NextResponse } from "next/server";
import { isSameOriginJsonRequest, isSameOriginRequest } from "@ahoy/shared";

/** The origin the browser used to reach this app (works behind Vercel's proxy). */
function requestOrigin(req: Request): string {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

/**
 * These handlers set or clear the refresh cookie, so a page on another site must
 * not be able to trigger them (login CSRF, forced logout). Returns a 403
 * response to send, or null when the request may proceed.
 */
export function rejectCrossSite(req: Request, { json }: { json: boolean }): NextResponse | null {
  const origin = requestOrigin(req);
  const ok = json ? isSameOriginJsonRequest(req.headers, origin) : isSameOriginRequest(req.headers, origin);
  return ok ? null : NextResponse.json({ message: "Geçersiz istek kaynağı" }, { status: 403 });
}

/** Responses that carry access tokens must never be cached by the browser or a CDN. */
export function noStore<T extends NextResponse>(response: T): T {
  response.headers.set("Cache-Control", "no-store");
  return response;
}
