import { randomUUID } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { env } from "../config/env.js";
import { HttpError } from "./errors.js";

/**
 * Cloudflare Turnstile, server side. The widget in apps/web only hands out a
 * token; it protects nothing until the token is redeemed here, once, with the
 * secret key. See
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * Sign-in, sign-up and password reset are not checked here: Supabase Auth
 * redeems those tokens itself (dashboard → Authentication → Bot and Abuse
 * Protection).
 */

export const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Cloudflare's public test secrets. Their answer does not depend on the token
 * (checked 2026-11-23: the always-pass secret also passed an arbitrary
 * string), so on a deployed API they would let any script through.
 */
export const TURNSTILE_TEST_SECRETS: ReadonlySet<string> = new Set([
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);

/** Widget actions checked by this API. apps/web renders the same names. */
export type TurnstileAction = "booking" | "captain_message";

export interface SiteverifyResponse {
  success: boolean;
  "error-codes"?: string[];
  action?: string;
  hostname?: string;
  challenge_ts?: string;
}

/** Cloudflare's documented maximum token length. */
const MAX_TOKEN_LENGTH = 2048;
const ATTEMPT_TIMEOUT_MS = 4000;
const ATTEMPTS = 2;

/** Error codes that mean our request or key is wrong, not the visitor's token. */
const SERVER_SIDE_CODES = new Set(["missing-input-secret", "invalid-input-secret", "bad-request", "internal-error"]);

export type TurnstileConfig = { secret: string; checkAction: boolean } | null;

/**
 * Which secret to enforce, if any. Test secrets are ignored on deployed
 * builds. They answer without `action`, so the action check only applies to
 * real keys.
 */
export function turnstileConfig(secret: string | undefined, deployed: boolean): TurnstileConfig {
  if (!secret) return null;
  const isTestSecret = TURNSTILE_TEST_SECRETS.has(secret);
  if (isTestSecret && deployed) return null;
  return { secret, checkAction: !isTestSecret };
}

const deployed = env.NODE_ENV === "production" || process.env.VERCEL === "1";
const config = turnstileConfig(env.TURNSTILE_SECRET_KEY, deployed);

/** For the startup log in app.ts. */
export const turnstileMode: "on" | "off" | "test-key-ignored" = config
  ? "on"
  : env.TURNSTILE_SECRET_KEY
    ? "test-key-ignored"
    : "off";

/**
 * POSTs one token to siteverify. Network errors, timeouts and `internal-error`
 * are retried once with the same idempotency key, so the retry cannot fail as
 * a duplicate. Throws when Cloudflare cannot be reached at all.
 */
export async function siteverify(
  secret: string,
  token: string,
  remoteip: string | undefined,
  fetchImpl: typeof fetch = fetch
): Promise<SiteverifyResponse> {
  const form = new URLSearchParams({ secret, response: token, idempotency_key: randomUUID() });
  if (remoteip) form.set("remoteip", remoteip);
  const body = form.toString();

  let lastError: unknown = new Error("siteverify was not called");
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetchImpl(SITEVERIFY_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });
      const data = (await res.json()) as SiteverifyResponse;
      if (!data.success && data["error-codes"]?.includes("internal-error") && attempt < ATTEMPTS) {
        lastError = new Error("siteverify internal-error");
        continue;
      }
      return data;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

/**
 * Rejects the request unless its JSON body carries `turnstileToken`, a fresh
 * token issued for `action`. Does nothing while TURNSTILE_SECRET_KEY is unset.
 * Call it before any other work, so a script without a token never reaches
 * the database.
 */
export async function assertTurnstile(req: FastifyRequest, action: TurnstileAction): Promise<void> {
  if (!config) return;

  const body = req.body as { turnstileToken?: unknown } | null | undefined;
  const token = body?.turnstileToken;
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    throw new HttpError(400, "Lütfen güvenlik doğrulamasını tamamla.", "TURNSTILE_REQUIRED");
  }

  let result: SiteverifyResponse;
  try {
    result = await siteverify(config.secret, token, req.ip);
  } catch (err) {
    req.log.error({ err }, "turnstile: siteverify unreachable");
    throw unavailable();
  }

  const codes = result["error-codes"] ?? [];
  if (!result.success && codes.some((code) => SERVER_SIDE_CODES.has(code))) {
    // A wrong or revoked TURNSTILE_SECRET_KEY lands here: our fault, not the visitor's.
    req.log.error({ codes }, "turnstile: siteverify rejected our request");
    throw unavailable();
  }
  if (!result.success || (config.checkAction && result.action !== action)) {
    req.log.warn({ codes, action: result.action, expected: action }, "turnstile: token rejected");
    throw new HttpError(
      403,
      "Güvenlik doğrulaması geçersiz ya da süresi dolmuş. Doğrulamayı yenileyip tekrar dene.",
      "TURNSTILE_FAILED"
    );
  }
}

function unavailable() {
  return new HttpError(
    503,
    "Güvenlik doğrulaması şu an yapılamıyor. Lütfen birkaç dakika sonra tekrar dene.",
    "TURNSTILE_UNAVAILABLE"
  );
}
