import { describe, it, expect } from "vitest";
import { rateLimit, fingerprint } from "@/lib/services/rate-limit";

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `rl-test-allow-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      const result = rateLimit(key, { limit: 5, windowMs: 60_000 });
      expect(result.ok).toBe(true);
    }
  });

  it("blocks the (limit+1)th request inside the window", () => {
    const key = `rl-test-block-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, { limit: 3, windowMs: 60_000 }).ok).toBe(true);
    }
    const blocked = rateLimit(key, { limit: 3, windowMs: 60_000 });
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetAt).toBeGreaterThan(Date.now());
  });

  it("resets the bucket after the window elapses", async () => {
    const key = `rl-test-reset-${Math.random()}`;
    expect(rateLimit(key, { limit: 1, windowMs: 50 }).ok).toBe(true);
    expect(rateLimit(key, { limit: 1, windowMs: 50 }).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 80));
    expect(rateLimit(key, { limit: 1, windowMs: 50 }).ok).toBe(true);
  });

  it("buckets are isolated per key", () => {
    const a = `rl-key-a-${Math.random()}`;
    const b = `rl-key-b-${Math.random()}`;
    expect(rateLimit(a, { limit: 1, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit(a, { limit: 1, windowMs: 60_000 }).ok).toBe(false);
    expect(rateLimit(b, { limit: 1, windowMs: 60_000 }).ok).toBe(true);
  });

  it("returns 'remaining' that counts down to zero", () => {
    const key = `rl-test-remaining-${Math.random()}`;
    expect(rateLimit(key, { limit: 3, windowMs: 60_000 }).remaining).toBe(2);
    expect(rateLimit(key, { limit: 3, windowMs: 60_000 }).remaining).toBe(1);
    expect(rateLimit(key, { limit: 3, windowMs: 60_000 }).remaining).toBe(0);
  });
});

describe("fingerprint", () => {
  it("uses the first IP from x-forwarded-for", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "10.0.0.1, 10.0.0.2, 10.0.0.3" },
    });
    expect(fingerprint(req, "signup")).toBe("10.0.0.1:signup");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("http://x", { headers: { "x-real-ip": "203.0.113.5" } });
    expect(fingerprint(req)).toBe("203.0.113.5:");
  });

  it("uses 'anon' when no IP headers present", () => {
    const req = new Request("http://x");
    expect(fingerprint(req, "tag")).toBe("anon:tag");
  });
});
