/**
 * Lightweight in-memory rate limiter
 * ----------------------------------------------------------------------------
 * Used to throttle abusive callers on public-ish API routes (e.g. signup).
 *
 * This is a single-process token-bucket — adequate for an MVP single-region
 * deployment. For multi-region production traffic, swap with `@upstash/ratelimit`
 * + Redis.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, opts: { limit: number; windowMs: number }): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    const fresh: Bucket = { count: 1, resetAt: now + opts.windowMs };
    buckets.set(key, fresh);
    return { ok: true, remaining: opts.limit - 1, resetAt: fresh.resetAt };
  }

  bucket.count += 1;
  if (bucket.count > opts.limit) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }
  return { ok: true, remaining: Math.max(0, opts.limit - bucket.count), resetAt: bucket.resetAt };
}

/** Best-effort caller fingerprint for rate-limit keys. */
export function fingerprint(request: Request, suffix = ""): string {
  const fwd = request.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anon";
  return `${ip}:${suffix}`;
}
