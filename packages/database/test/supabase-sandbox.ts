import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";

const pkgDir = fileURLToPath(new URL("..", import.meta.url));
export const sqlFile = (rel: string) => readFileSync(fileURLToPath(new URL(`../prisma/${rel}`, import.meta.url)), "utf8");

let cachedDdl: string | null = null;

/** The schema exactly as schema.prisma describes it, generated offline (no database connection). */
export function schemaDdl(): string {
  cachedDdl ??= execFileSync(
    "node_modules/.bin/prisma",
    ["migrate", "diff", "--from-empty", "--to-schema-datamodel", "prisma/schema.prisma", "--script"],
    { cwd: pkgDir, encoding: "utf8", env: { PATH: process.env.PATH ?? "" }, stdio: ["ignore", "pipe", "ignore"] }
  );
  return cachedDdl;
}

/**
 * An in-process Postgres that mimics the parts of a Supabase project that matter here:
 * the anon/authenticated/service_role roles, auth.uid() from JWT claims, a storage.buckets
 * table, and Supabase's default privileges, which grant anon and authenticated everything
 * on new tables in public. Nothing here touches a real database.
 */
export async function createSupabaseLikeDb(): Promise<PGlite> {
  const db = new PGlite({ extensions: { btree_gist } });
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
    alter default privileges for role postgres in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated, service_role;
    alter default privileges for role postgres in schema public grant all on functions to anon, authenticated, service_role;

    create schema auth;
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;

    create schema storage;
    create table storage.buckets (
      id text primary key, name text not null, public boolean default false,
      file_size_limit bigint, allowed_mime_types text[]
    );
  `);
  await db.exec(schemaDdl());
  return db;
}

/** Runs `sql` as a PostgREST role, optionally with a Supabase-Auth user id, then resets. */
export async function asRole<T>(db: PGlite, role: "anon" | "authenticated", fn: () => Promise<T>, sub?: string) {
  await db.exec(`select set_config('request.jwt.claim.sub', '${sub ?? ""}', false); set role ${role};`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

/** Postgres error code of a statement, or "ok". */
export async function outcome(db: PGlite, sql: string): Promise<string> {
  try {
    await db.query(sql);
    return "ok";
  } catch (e) {
    return (e as { code?: string }).code ?? "error";
  }
}

export async function publicTables(db: PGlite): Promise<Array<{ table: string; column: string }>> {
  const { rows } = await db.query<{ table: string; column: string }>(`
    select c.relname as table,
           (select a.attname from pg_attribute a where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped order by a.attnum limit 1) as column
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') order by 1`);
  return rows;
}
