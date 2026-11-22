import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";

// This file runs in its own process: configure a production-like API before importing it.
Object.assign(process.env, {
  NODE_ENV: "production",
  JWT_SECRET: "c".repeat(40),
  ADMIN_JWT_SECRET: "d".repeat(40),
  CAPTAIN_ORIGIN: "https://captain.test",
  ADMIN_ORIGIN: "https://admin.test",
  WEB_ORIGIN: "https://web.test",
});

let app: FastifyInstance;

before(async () => {
  const { buildApp } = await import("../src/app.ts");
  app = await buildApp();
  app.get("/__boom", async () => {
    throw new Error('relation "admin_users" does not exist — secret internals');
  });
  await app.ready();
});

after(() => app?.close());

const post = (headers: Record<string, string>) =>
  app.inject({ method: "POST", url: "/api/v1/bookings", payload: {}, headers });

test("cross-site POST carrying cookies is refused before any handler runs", async () => {
  const res = await post({ origin: "https://evil.example", cookie: "admin_token=stolen" });
  assert.equal(res.statusCode, 403);
  assert.equal(res.json().code, "FORBIDDEN_ORIGIN");
});

test("the same request from our own admin origin reaches the route (validation error)", async () => {
  const res = await post({ origin: "https://admin.test", cookie: "admin_token=x" });
  assert.equal(res.statusCode, 400);
});

test("cookie-less cross-origin requests (public API) are not affected", async () => {
  assert.equal((await post({ origin: "https://evil.example" })).statusCode, 400);
  const get = await app.inject({
    method: "GET",
    url: "/health",
    headers: { origin: "https://evil.example", cookie: "a=b" },
  });
  assert.equal(get.statusCode, 200);
});

test("5xx responses never echo internal error messages", async () => {
  const res = await app.inject({ method: "GET", url: "/__boom" });
  assert.equal(res.statusCode, 500);
  const body = res.json();
  assert.equal(body.message, "Internal Server Error");
  assert.ok(body.requestId);
  assert.equal(res.body.includes("admin_users"), false);
});

test("production CORS does not grant credentials to localhost origins", async () => {
  const preflight = (origin: string) =>
    app.inject({
      method: "OPTIONS",
      url: "/api/v1/bookings/captain",
      headers: { origin, "access-control-request-method": "GET" },
    });
  const local = await preflight("http://localhost:3001");
  assert.notEqual(local.headers["access-control-allow-origin"], "http://localhost:3001");

  const captain = await preflight("https://captain.test");
  assert.equal(captain.headers["access-control-allow-origin"], "https://captain.test");
  assert.equal(captain.headers["access-control-allow-credentials"], "true");
});

test("captain JWTs sign and verify after the @fastify/jwt 10 upgrade", async () => {
  const token = app.jwt.sign({ sub: "cap_1", role: "OWNER" }, { expiresIn: "30m" });
  const payload = await app.jwt.verify<{ sub: string }>(token);
  assert.equal(payload.sub, "cap_1");
});

test("a token forged with the old public default secret is rejected", async () => {
  const { default: jsonwebtoken } = await import("jsonwebtoken");
  const forged = jsonwebtoken.sign({ sub: "cap_1", role: "ADMIN" }, "change-me-in-production");
  // verify() without a callback throws synchronously
  assert.throws(() => app.jwt.verify(forged), /signature is invalid/);
  const res = await app.inject({ method: "GET", url: "/api/v1/auth/me", headers: { authorization: `Bearer ${forged}` } });
  assert.equal(res.statusCode, 401);
});
