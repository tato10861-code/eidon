/**
 * Rate limiting — two implementations:
 *
 * 1. `rateLimit(key, max, windowMs)` — in-memory sliding window (no DB).
 *    Used by API routes for fast, stateless per-process limiting.
 *
 * 2. `checkRateLimit(key, config)` — Neon-backed distributed rate limit
 *    with tier-aware limits (free / starter / pro / enterprise).

 * Sliding-window rate limiter backed by Neon (Postgres).
 */

// ─── In-memory rate limiter ───────────────────────────────────────────────────
// Lightweight, no DB required. Per-process only (resets on cold start).

const _store = new Map<string, number[]>();

export interface RateLimitRecord {
  ok: boolean;
  remaining: number;
  limit: number;
  retryAfter?: number;
}

/**
 * Simple in-process sliding-window check.
 * @param key       Unique identifier (ip, workspace, etc.)
 * @param max       Maximum requests in the window
 * @param windowMs  Window size in milliseconds
 */
export function rateLimit(key: string, max: number, windowMs: number): RateLimitRecord {
  const now = Date.now();
  const hits = (_store.get(key) ?? []).filter((t) => t > now - windowMs);
  if (hits.length >= max) {
    _store.set(key, hits);
    const oldest = hits[0] ?? now;
    return {
      ok: false,
      remaining: 0,
      limit: max,
      retryAfter: Math.ceil((oldest + windowMs - now) / 1000),
    };
  }
  hits.push(now);
  _store.set(key, hits);
  return { ok: true, remaining: max - hits.length, limit: max };
}

// ─── DB-backed rate limiter ───────────────────────────────────────────────────
/**
 * Uses an append-only `rate_limit_log` table with a composite index on
 * (key, timestamp). Falls back to allow-all when the DB is not configured,
 * so development environments are never blocked.
 *
 * Tier limits (requests per window):
 *   free:       100 req / 60s
 *   starter:   1000 req / 60s
 *   pro:       5000 req / 60s
 *   enterprise:  unlimited
 */

import { getNeon } from "./neon";

export type RateLimitTier = "free" | "starter" | "pro" | "enterprise";

export interface RateLimitConfig {
  tier: RateLimitTier;
  windowSeconds?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  tier: RateLimitTier;
}

const TIER_LIMITS: Record<RateLimitTier, number | null> = {
  free: 100,
  starter: 1000,
  pro: 5000,
  enterprise: null, // unlimited
};

const DEFAULT_WINDOW_SECONDS = 60;

/**
 * Check and record a rate limit hit for the given key.
 *
 * @param key     Unique identifier (workspace_id, api_key_id, ip, etc.)
 * @param config  Tier and optional window size
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const { tier, windowSeconds = DEFAULT_WINDOW_SECONDS } = config;
  const limit = TIER_LIMITS[tier];
  const resetAt = new Date(Date.now() + windowSeconds * 1000);

  // Enterprise: always allow
  if (limit === null) {
    return { allowed: true, remaining: Infinity, limit: Infinity, resetAt, tier };
  }

  const neon = getNeon();
  if (!neon) {
    // No DB — allow all in dev
    return { allowed: true, remaining: limit, limit, resetAt, tier };
  }

  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

  // Count hits in the current window
  type CountRow = { n: string };
  const countRows = (await neon`
    SELECT COUNT(*) AS n FROM rate_limit_log
    WHERE key = ${key} AND created_at >= ${windowStart}
  `) as unknown as CountRow[];

  const count = parseInt(countRows[0]?.n ?? "0", 10);

  if (count >= limit) {
    return { allowed: false, remaining: 0, limit, resetAt, tier };
  }

  // Record this hit (fire-and-forget, non-blocking)
  neon`
    INSERT INTO rate_limit_log (key, tier, created_at)
    VALUES (${key}, ${tier}, ${new Date().toISOString()})
  `.catch(() => {});

  return { allowed: true, remaining: limit - count - 1, limit, resetAt, tier };
}

/**
 * Build a standard set of rate-limit response headers.
 */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(isFinite(result.limit) ? result.limit : 999999),
    "X-RateLimit-Remaining": String(isFinite(result.remaining) ? result.remaining : 999999),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt.getTime() / 1000)),
    "X-RateLimit-Tier": result.tier,
  };
}

/**
 * Convenience: build a 429 response with proper headers.
 */
export function tooManyRequests(result: RateLimitResult): Response {
  return Response.json(
    {
      error: "Too Many Requests",
      tier: result.tier,
      limit: result.limit,
      retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        ...rateLimitHeaders(result),
        "Retry-After": String(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)),
      },
    },
  );
}
