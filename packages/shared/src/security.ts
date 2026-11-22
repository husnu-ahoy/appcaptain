/**
 * Small, dependency-free request guards shared by the Next.js apps.
 * Unit tests: packages/shared/test/security.test.ts.
 */

// The package compiles without DOM/node typings; URL exists in every runtime we target.
type UrlLike = { origin: string; pathname: string; search: string; hash: string };
const URLCtor = (globalThis as unknown as { URL: new (input: string, base?: string) => UrlLike }).URL;

/**
 * Turns a `?redirect=` value into a same-origin path, or null.
 *
 * A prefix check ("starts with / but not //") is not enough: browsers treat
 * `/\evil.example` and `/<TAB>/evil.example` as protocol-relative URLs
 * (docs/security-audit.md, SEC-19). Parsing with the WHATWG URL parser and
 * comparing origins is what the browser will actually do.
 */
export function safeRedirectPath(target: string | null | undefined, origin: string): string | null {
  if (!target || !target.startsWith("/")) return null;
  try {
    const url = new URLCtor(target, origin);
    if (url.origin !== new URLCtor(origin).origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

type HeaderReader = { get(name: string): string | null };

/**
 * True when a state-changing request comes from our own pages. Browsers always
 * send Origin on cross-origin POSTs and Sec-Fetch-Site on modern engines, so a
 * form auto-submitted from another site is refused (login CSRF, forced logout).
 */
export function isSameOriginRequest(headers: HeaderReader, expectedOrigin: string): boolean {
  const site = headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = headers.get("origin");
  if (origin && origin !== expectedOrigin) return false;
  return true;
}

/** Same-origin and JSON: HTML forms cannot send application/json, so this also blocks text/plain tricks. */
export function isSameOriginJsonRequest(headers: HeaderReader, expectedOrigin: string): boolean {
  const contentType = (headers.get("content-type") ?? "").toLowerCase();
  return contentType.startsWith("application/json") && isSameOriginRequest(headers, expectedOrigin);
}
