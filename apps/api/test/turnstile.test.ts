import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import { SignJWT } from "jose";

// This file runs in its own process: enable Turnstile with a real-looking secret
// (so the action check applies) before the app is imported.
const SECRET = "turnstile-secret-for-tests-only";
const SUPABASE_JWT_SECRET = "supabase-test-secret-0123456789abcdef0123";
Object.assign(process.env, { TURNSTILE_SECRET_KEY: SECRET, SUPABASE_JWT_SECRET });

const { SITEVERIFY_URL, siteverify, turnstileConfig } = await import("../src/lib/turnstile.ts");

/* ---------- a fake siteverify ---------- */

type Reply = Record<string, unknown>;
const REPLIES: Record<string, Reply> = {
  "ok-booking": { success: true, action: "booking", hostname: "web.test" },
  "ok-message": { success: true, action: "captain_message", hostname: "web.test" },
  "ok-other-action": { success: true, action: "login", hostname: "web.test" },
  spent: { success: false, "error-codes": ["timeout-or-duplicate"] },
  "bad-secret": { success: false, "error-codes": ["invalid-input-secret"] },
};

let calls: URLSearchParams[] = [];
let failures: ("network" | "internal-error")[] = [];

globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  assert.equal(String(input), SITEVERIFY_URL);
  const form = new URLSearchParams(String(init?.body));
  calls.push(form);
  const failure = failures.shift();
  if (failure === "network") throw new TypeError("fetch failed");
  const reply =
    failure === "internal-error"
      ? { success: false, "error-codes": ["internal-error"] }
      : (REPLIES[form.get("response") ?? ""] ?? { success: false, "error-codes": ["invalid-input-response"] });
  return new Response(JSON.stringify(reply), { headers: { "content-type": "application/json" } });
}) as typeof fetch;

/* ---------- app ---------- */

let app: FastifyInstance;
let customerToken: string;

before(async () => {
  const { buildApp } = await import("../src/app.ts");
  app = await buildApp();
  await app.ready();
  customerToken = await new SignJWT({ email: "misafir@example.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("customer-1")
    .setExpirationTime("10m")
    .sign(new TextEncoder().encode(SUPABASE_JWT_SECRET));
});

after(() => app?.close());

beforeEach(() => {
  calls = [];
  failures = [];
});

const book = (payload: object) => app.inject({ method: "POST", url: "/api/v1/bookings", payload });
const firstMessage = (payload: object, auth = true) =>
  app.inject({
    method: "POST",
    url: "/api/v1/customer/boats/boat-1/messages",
    payload,
    headers: auth ? { authorization: `Bearer ${customerToken}` } : {},
  });

/* ---------- booking requests ---------- */

test("a booking request without a token is refused before Cloudflare or the database", async () => {
  const res = await book({});
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, "TURNSTILE_REQUIRED");
  assert.equal(calls.length, 0);
});

test("an oversized token is refused without calling Cloudflare", async () => {
  const res = await book({ turnstileToken: "x".repeat(2049) });
  assert.equal(res.json().code, "TURNSTILE_REQUIRED");
  assert.equal(calls.length, 0);
});

test("a valid booking token passes and the request reaches validation", async () => {
  const res = await book({ turnstileToken: "ok-booking" });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, "VALIDATION_ERROR");

  assert.equal(calls.length, 1);
  const sent = calls[0]!;
  assert.equal(sent.get("secret"), SECRET);
  assert.equal(sent.get("response"), "ok-booking");
  assert.equal(sent.get("remoteip"), "127.0.0.1");
  assert.match(sent.get("idempotency_key") ?? "", /^[0-9a-f-]{36}$/);
});

test("a spent or expired token is refused with 403", async () => {
  const res = await book({ turnstileToken: "spent" });
  assert.equal(res.statusCode, 403);
  assert.equal(res.json().code, "TURNSTILE_FAILED");
});

test("a token issued for another form is refused", async () => {
  const res = await book({ turnstileToken: "ok-other-action" });
  assert.equal(res.statusCode, 403);
  assert.equal(res.json().code, "TURNSTILE_FAILED");
});

test("a rejected secret key is reported as our outage, not the visitor's mistake", async () => {
  const res = await book({ turnstileToken: "bad-secret" });
  assert.equal(res.statusCode, 503);
  assert.equal(res.json().code, "TURNSTILE_UNAVAILABLE");
});

test("one network error is retried with the same idempotency key", async () => {
  failures = ["network"];
  const res = await book({ turnstileToken: "ok-booking" });
  assert.equal(res.json().code, "VALIDATION_ERROR");
  assert.equal(calls.length, 2);
  assert.equal(calls[0]!.get("idempotency_key"), calls[1]!.get("idempotency_key"));
});

test("Cloudflare's internal-error is retried once", async () => {
  failures = ["internal-error"];
  const res = await book({ turnstileToken: "ok-booking" });
  assert.equal(res.json().code, "VALIDATION_ERROR");
  assert.equal(calls.length, 2);
});

test("when Cloudflare cannot be reached the request fails closed with 503", async () => {
  failures = ["network", "network"];
  const res = await book({ turnstileToken: "ok-booking" });
  assert.equal(res.statusCode, 503);
  assert.equal(res.json().code, "TURNSTILE_UNAVAILABLE");
});

/* ---------- first message to a captain ---------- */

test("the first message to a captain needs a sign-in before anything else", async () => {
  const res = await firstMessage({ content: "Merhaba" }, false);
  assert.equal(res.statusCode, 401);
  assert.equal(calls.length, 0);
});

test("a signed-in guest still needs a token for the first message", async () => {
  const res = await firstMessage({ content: "Merhaba" });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, "TURNSTILE_REQUIRED");
});

test("a booking token cannot be used for a message", async () => {
  const res = await firstMessage({ content: "Merhaba", turnstileToken: "ok-booking" });
  assert.equal(res.statusCode, 403);
});

test("a message token passes and the request reaches validation", async () => {
  const res = await firstMessage({ content: "", turnstileToken: "ok-message" });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, "VALIDATION_ERROR");
});

test("replies inside an existing conversation are not challenged", async () => {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/customer/conversations/conv-1/messages",
    payload: { content: "" },
    headers: { authorization: `Bearer ${customerToken}` },
  });
  assert.equal(res.json().code, "VALIDATION_ERROR");
  assert.equal(calls.length, 0);
});

/* ---------- configuration ---------- */

test("no secret means no check", () => {
  assert.equal(turnstileConfig(undefined, true), null);
  assert.equal(turnstileConfig(undefined, false), null);
});

test("Cloudflare test secrets work locally but are ignored on deployed builds", () => {
  assert.deepEqual(turnstileConfig("1x0000000000000000000000000000000AA", false), {
    secret: "1x0000000000000000000000000000000AA",
    checkAction: false,
  });
  assert.equal(turnstileConfig("1x0000000000000000000000000000000AA", true), null);
});

test("real secrets are enforced together with the action check", () => {
  assert.deepEqual(turnstileConfig(SECRET, true), { secret: SECRET, checkAction: true });
});

test("siteverify gives up after two failed attempts", async () => {
  failures = ["network", "network"];
  await assert.rejects(siteverify(SECRET, "ok-booking", undefined), /fetch failed/);
  assert.equal(calls.length, 2);
  assert.equal(calls[0]!.has("remoteip"), false);
});
