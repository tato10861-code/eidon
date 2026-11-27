type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

export function rateLimit(key: string, limit = 40, windowMs = 60_000) {
  const now = Date.now();

  if (now - lastSweep > windowMs * 5) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(bucketKey);
    }
    lastSweep = now;
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return { ok: true, remaining: limit - existing.count, retryAfter: 0 };
}
