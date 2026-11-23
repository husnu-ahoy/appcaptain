import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";

// This file runs in its own process: a deployed API that was given Cloudflare's
// public test secret by mistake. That secret passes any token, so trusting it
// would let every script through: the key is ignored and requests behave as before.
Object.assign(process.env, {
  NODE_ENV: "production",
  JWT_SECRET: "c".repeat(40),
  ADMIN_JWT_SECRET: "d".repeat(40),
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
});

let fetchCalls = 0;
globalThis.fetch = (async () => {
  fetchCalls++;
  throw new Error("no network in this test");
}) as typeof fetch;

let app: FastifyInstance;

before(async () => {
  const { buildApp } = await import("../src/app.ts");
  app = await buildApp();
  await app.ready();
});

after(() => app?.close());

test("a deployed API ignores Cloudflare's test secret", async () => {
  const { turnstileMode } = await import("../src/lib/turnstile.ts");
  assert.equal(turnstileMode, "test-key-ignored");

  const res = await app.inject({ method: "POST", url: "/api/v1/bookings", payload: {} });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, "VALIDATION_ERROR");
  assert.equal(fetchCalls, 0);
});
