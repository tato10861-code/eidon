import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rate limiter", () => {
  it("allows requests under the limit", () => {
    const key = `test:${Math.random()}`;
    const result = rateLimit(key, 3, 60_000);
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks after the limit is exceeded", () => {
    const key = `test:${Math.random()}`;
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    const third = rateLimit(key, 2, 60_000);
    expect(third.ok).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.retryAfter).toBeGreaterThan(0);
  });

  it("resets after the window", async () => {
    const key = `test:${Math.random()}`;
    rateLimit(key, 1, 10);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const result = rateLimit(key, 1, 10);
    expect(result.ok).toBe(true);
  });
});
