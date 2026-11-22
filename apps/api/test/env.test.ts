import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const envModule = pathToFileURL(fileURLToPath(new URL("../src/config/env.ts", import.meta.url))).href;

const STRONG = "a".repeat(20) + "b".repeat(20);
const ADMIN = "admin-secret-".padEnd(40, "x");

/** Loads env.ts in a clean child process (no .env files reachable) and reports the outcome. */
function loadEnv(vars: Record<string, string | undefined>) {
  const child = spawnSync(
    process.execPath,
    ["--import", import.meta.resolve("tsx"), "--input-type=module", "-e", `await import(${JSON.stringify(envModule)})`],
    {
      cwd: tmpdir(),
      encoding: "utf8",
      env: { PATH: process.env.PATH, ADMIN_JWT_SECRET: ADMIN, ...vars },
    }
  );
  return { ok: child.status === 0, output: `${child.stdout}${child.stderr}` };
}

test("production refuses to start without JWT_SECRET (public default)", () => {
  const r = loadEnv({ NODE_ENV: "production" });
  assert.equal(r.ok, false);
  assert.match(r.output, /JWT_SECRET must be set/);
});

test("Vercel runtime is treated as production even without NODE_ENV", () => {
  const r = loadEnv({ VERCEL: "1" });
  assert.equal(r.ok, false);
  assert.match(r.output, /JWT_SECRET must be set/);
});

test("production rejects the placeholder from .env.example and short secrets", () => {
  assert.equal(loadEnv({ NODE_ENV: "production", JWT_SECRET: "change-me-in-production" }).ok, false);
  assert.equal(loadEnv({ NODE_ENV: "production", JWT_SECRET: "short-but-8+" }).ok, false);
});

test("production rejects JWT_SECRET reused from the admin secret", () => {
  const r = loadEnv({ NODE_ENV: "production", JWT_SECRET: ADMIN });
  assert.equal(r.ok, false);
  assert.match(r.output, /must differ/);
});

test("production starts with a strong, distinct secret", () => {
  const r = loadEnv({ NODE_ENV: "production", JWT_SECRET: STRONG });
  assert.equal(r.ok, true, r.output);
});

test("local development keeps working without JWT_SECRET", () => {
  const r = loadEnv({ NODE_ENV: "development" });
  assert.equal(r.ok, true, r.output);
});
