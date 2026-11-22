/**
 * Loaded before every test file (`node --import ./setup.ts`).
 *
 * Tests never talk to a real database: DATABASE_URL points at a closed local
 * port, and the run starts in apps/api/test so env.ts cannot pick up the repo's
 * root .env (which points at the shared Supabase project).
 */
const DEFAULTS: Record<string, string> = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://test:test@127.0.0.1:9/test",
  JWT_SECRET: "test-captain-secret-0123456789abcdef0123456789",
  ADMIN_JWT_SECRET: "test-admin-secret-0123456789abcdef0123456789ab",
};

for (const [key, value] of Object.entries(DEFAULTS)) {
  process.env[key] ??= value;
}

const db = process.env.DATABASE_URL ?? "";
if (!/@(127\.0\.0\.1|localhost)[:/]/.test(db)) {
  throw new Error("Refusing to run tests: DATABASE_URL must point at localhost");
}
for (const key of ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_URL"]) {
  if (process.env[key]) throw new Error(`Refusing to run tests with ${key} set`);
}
