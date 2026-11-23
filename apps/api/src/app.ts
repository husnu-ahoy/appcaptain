import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { authPlugin } from "./plugins/auth.js";
import { captainAuthPlugin } from "./plugins/captain-auth.js";
import { customerAuthPlugin } from "./plugins/customer-auth.js";
import { adminAuthPlugin } from "./plugins/admin-auth.js";
import { registerRoutes } from "./routes/index.js";
import { HttpError } from "./lib/errors.js";
import { turnstileMode } from "./lib/turnstile.js";
import { captainOrigins, adminOrigins, webOrigins, env } from "./config/env.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function buildApp() {
  const isDeployed = env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const app = Fastify({
    logger: {
      transport:
        process.env.NODE_ENV === "development"
          ? { target: "pino-pretty" }
          : undefined,
    },
    // Vercel overwrites X-Forwarded-For with the client address; trust it there so
    // req.ip (audit logs, rate limits) is the visitor rather than the proxy.
    trustProxy: process.env.VERCEL === "1",
  });

  if (isDeployed && turnstileMode === "off") {
    app.log.warn("TURNSTILE_SECRET_KEY is not set: booking requests and first messages are accepted without a Turnstile check");
  } else if (turnstileMode === "test-key-ignored") {
    app.log.error("TURNSTILE_SECRET_KEY is a Cloudflare test key, which lets any script through: Turnstile checks stay off until the widget's real secret key is set");
  }

  // Known production/local origins that are always allowed, merged with the
  // env-driven CAPTAIN_ORIGIN/ADMIN_ORIGIN/WEB_ORIGIN lists (deduped) so the
  // captain/admin/web apps work even if a Vercel env var is missing.
  const defaultOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "https://appcaptain-captain.vercel.app",
    "https://appcaptain-admin.vercel.app",
    "https://appcaptain-web.vercel.app",
  ];
  // In production a dev server on someone's machine (or the localhost defaults of
  // CAPTAIN_ORIGIN/ADMIN_ORIGIN/WEB_ORIGIN) must not get credentialed access.
  const isLocalOrigin = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const allowedOrigins = [
    ...new Set([...defaultOrigins, ...captainOrigins, ...adminOrigins, ...webOrigins]),
  ].filter((origin) => !isDeployed || !isLocalOrigin(origin));

  // Public marketplace routes (apps/web) must be reachable from any origin,
  // with no credentials/cookies involved. Everything else (captain/admin
  // panels) stays locked to the known origin whitelist above.
  await app.register(cors, {
    delegator: (req, callback) => {
      const isPublicRoute = req.url.startsWith("/api/v1/public");
      callback(null, {
        origin: isPublicRoute ? true : allowedOrigins,
        credentials: !isPublicRoute,
      });
    },
  });
  await app.register(cookie);

  // CSRF guard for cookie-authenticated sessions (admin_token is SameSite=None in
  // production): a state-changing request that carries cookies must come from one
  // of our own origins. Requests without cookies or without an Origin header
  // (server-to-server, curl) are unaffected.
  app.addHook("onRequest", async (req, reply) => {
    if (SAFE_METHODS.has(req.method)) return;
    const origin = req.headers.origin;
    if (!origin || !req.headers.cookie) return;
    if (allowedOrigins.includes(origin)) return;
    return reply.code(403).send({ message: "Forbidden origin", code: "FORBIDDEN_ORIGIN" });
  });

  await app.register(authPlugin); // legacy JWT (phase 0)
  await app.register(captainAuthPlugin);
  await app.register(customerAuthPlugin); // web müşterileri (Supabase oturumu)
  await app.register(adminAuthPlugin);
  await registerRoutes(app);

  app.setErrorHandler((error: FastifyError, req, reply) => {
    if (error instanceof HttpError) {
      const enriched = error as HttpError & { details?: unknown; fields?: unknown };
      return reply.code(error.statusCode).send({
        message: error.message,
        code: error.code,
        error: error.code,
        fields: enriched.fields,
        details: enriched.details,
      });
    }
    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      // Never echo internal messages (Prisma, Supabase, stack details) to clients.
      req.log.error({ err: error }, "unhandled error");
      return reply.code(statusCode).send({ message: "Internal Server Error", requestId: req.id });
    }
    req.log.warn({ err: error }, "client error");
    return reply.code(statusCode).send({ message: error.message ?? "Bad Request" });
  });

  return app;
}
