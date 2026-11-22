import { test } from "node:test";
import assert from "node:assert/strict";
import { isSameOriginJsonRequest, isSameOriginRequest, safeRedirectPath } from "../src/security.ts";

const ORIGIN = "https://captain.example";

test("safeRedirectPath keeps internal paths", () => {
  assert.equal(safeRedirectPath("/bookings?status=PENDING#top", ORIGIN), "/bookings?status=PENDING#top");
  assert.equal(safeRedirectPath("/", ORIGIN), "/");
});

test("safeRedirectPath refuses every off-site form the old prefix check let through", () => {
  for (const target of [
    "//evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "https://evil.example",
    "javascript:alert(1)",
    "evil.example",
    "",
    null,
  ]) {
    assert.equal(safeRedirectPath(target, ORIGIN), null, JSON.stringify(target));
  }
});

const headers = (h: Record<string, string>) => ({ get: (n: string) => h[n.toLowerCase()] ?? null });

test("same-origin JSON requests from our pages pass", () => {
  assert.equal(
    isSameOriginJsonRequest(headers({ "content-type": "application/json", origin: ORIGIN, "sec-fetch-site": "same-origin" }), ORIGIN),
    true
  );
});

test("cross-site form posts are refused (login CSRF)", () => {
  assert.equal(
    isSameOriginJsonRequest(headers({ "content-type": "text/plain", origin: "https://evil.example", "sec-fetch-site": "cross-site" }), ORIGIN),
    false
  );
  assert.equal(isSameOriginJsonRequest(headers({ "content-type": "text/plain", origin: ORIGIN }), ORIGIN), false);
  assert.equal(isSameOriginRequest(headers({ origin: "https://evil.example" }), ORIGIN), false);
  assert.equal(isSameOriginRequest(headers({ "sec-fetch-site": "same-site" }), ORIGIN), false);
});

test("requests without browser metadata (server-side, curl) are not blocked by the origin check", () => {
  assert.equal(isSameOriginRequest(headers({}), ORIGIN), true);
});
