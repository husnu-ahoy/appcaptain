import { before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { PGlite } from "@electric-sql/pglite";
import { asRole, createSupabaseLikeDb, outcome, publicTables, sqlFile } from "./supabase-sandbox.ts";

const UID = "6f0c9b2e-2a7e-4a59-9a8e-1f6d3c2b1a00";
const LOCKDOWN = sqlFile("security/001_lock_down_data_api.sql");
const POLICIES = sqlFile("supabase-policies.sql");
const POLICIES_BEFORE_001 = readFileSync(new URL("./fixtures/supabase-policies.before-001.sql", import.meta.url), "utf8");

const insertAdminProfile = `insert into public.profiles (id, email, "passwordHash", role, "updatedAt")
  values ('${UID}', 'attacker@example.com', '$2a$10$attackerchosenhash', 'ADMIN', now())`;

describe("before the fix (Supabase defaults + the previous supabase-policies.sql)", () => {
  let db: PGlite;
  before(async () => {
    db = await createSupabaseLikeDb();
    await db.exec(POLICIES_BEFORE_001);
  });

  test("the public anon key can read and write credential tables", async () => {
    assert.equal(await asRole(db, "anon", () => outcome(db, "select * from public.admin_users")), "ok");
    assert.equal(await asRole(db, "anon", () => outcome(db, "select * from public.refresh_tokens")), "ok");
    assert.equal(await asRole(db, "anon", () => outcome(db, "delete from public.audit_logs")), "ok");
  });

  test("a self-registered Supabase user can create their own ADMIN profile", async () => {
    assert.equal(await asRole(db, "authenticated", () => outcome(db, insertAdminProfile), UID), "ok");
    const { rows } = await db.query<{ admin: boolean }>(
      `select exists(select 1 from public.profiles where id = '${UID}' and role = 'ADMIN') as admin`
    );
    assert.equal(rows[0]?.admin, true);
  });
});

describe("after 001_lock_down_data_api.sql", () => {
  let db: PGlite;
  before(async () => {
    db = await createSupabaseLikeDb();
    await db.exec(POLICIES);
    await db.exec(LOCKDOWN);
  });

  test("anon and authenticated get permission denied on every table, for every operation", async () => {
    const tables = await publicTables(db);
    assert.ok(tables.length >= 50, `expected the full schema, got ${tables.length} tables`);
    for (const role of ["anon", "authenticated"] as const) {
      for (const { table, column } of tables) {
        const t = `public."${table}"`;
        const results = await asRole(
          db,
          role,
          async () => ({
            select: await outcome(db, `select 1 from ${t} limit 1`),
            insert: await outcome(db, `insert into ${t} default values`),
            update: await outcome(db, `update ${t} set "${column}" = "${column}" where false`),
            delete: await outcome(db, `delete from ${t} where false`),
          }),
          UID
        );
        assert.deepEqual(
          results,
          { select: "42501", insert: "42501", update: "42501", delete: "42501" },
          `${role} on ${table}`
        );
      }
    }
  });

  test("the ADMIN self-insert is refused and is_admin() is gone", async () => {
    assert.equal(await asRole(db, "authenticated", () => outcome(db, insertAdminProfile), UID), "42501");
    assert.equal(await outcome(db, "select public.is_admin()"), "42883");
  });

  test("RLS is enabled on every public table as a second layer", async () => {
    const { rows } = await db.query<{ relname: string }>(`
      select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r','p') and not c.relrowsecurity`);
    assert.deepEqual(rows, []);
  });

  test("the table owner (Prisma's connection) keeps full access", async () => {
    assert.equal(
      await outcome(db, `insert into public.system_settings (key, value, "updatedAt") values ('test_key', 'v', now())`),
      "ok"
    );
    const { rows } = await db.query<{ n: number }>("select count(*)::int as n from public.system_settings");
    assert.equal(rows[0]?.n, 1);
  });

  test("tables created later (prisma db push) are not exposed either", async () => {
    await db.exec("create table public.future_table (id text primary key)");
    assert.equal(await asRole(db, "anon", () => outcome(db, "select * from public.future_table")), "42501");
  });

  test("the script is idempotent", async () => {
    await db.exec(LOCKDOWN);
    assert.equal(await asRole(db, "anon", () => outcome(db, "select * from public.bookings")), "42501");
  });

  test("the down script restores the previous grants (documented emergency rollback)", async () => {
    const copy = await createSupabaseLikeDb();
    await copy.exec(LOCKDOWN);
    await copy.exec(sqlFile("security/001_lock_down_data_api.down.sql"));
    // RLS stays on, so reads succeed but return nothing; writes are blocked by RLS (42501).
    assert.equal(await asRole(copy, "anon", () => outcome(copy, "select * from public.bookings")), "ok");
    await copy.close();
  });
});

describe("storage buckets (supabase-policies.sql + 003)", () => {
  test("buckets keep their privacy and get size/type limits", async () => {
    const db = await createSupabaseLikeDb();
    await db.exec(POLICIES);
    await db.exec(sqlFile("security/003_storage_bucket_limits.sql"));
    const { rows } = await db.query<{ id: string; public: boolean; svg: boolean; pdf: boolean; limited: boolean }>(`
      select id, public, 'image/svg+xml' = any(allowed_mime_types) as svg,
             'application/pdf' = any(allowed_mime_types) as pdf, file_size_limit > 0 as limited
      from storage.buckets order by id`);
    assert.deepEqual(rows, [
      { id: "boat-documents", public: false, svg: false, pdf: true, limited: true },
      { id: "boat-photos", public: true, svg: false, pdf: true, limited: true },
      { id: "experience-photo", public: true, svg: false, pdf: false, limited: true },
    ]);
    await db.close();
  });
});
