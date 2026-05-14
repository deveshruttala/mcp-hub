import { describe, it, expect } from "vitest";
import { cn, formatDate, formatRelative, safeJsonParse, maskApiKey, slugify } from "@/lib/utils";

describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm font-bold", "text-base")).toBe("font-bold text-base");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "shown")).toBe("base shown");
  });
});

describe("formatDate", () => {
  it("returns em-dash for null", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });

  it("formats a real date", () => {
    const out = formatDate(new Date("2026-01-15T10:30:00Z"));
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/Jan/);
  });
});

describe("formatRelative", () => {
  it("returns 'never' for null", () => {
    expect(formatRelative(null)).toBe("never");
  });

  it("returns em-dash for invalid date", () => {
    expect(formatRelative("not-a-date")).toBe("—");
  });

  it("formats recent past as Xs ago", () => {
    const d = new Date(Date.now() - 5 * 1000);
    expect(formatRelative(d)).toMatch(/^\d+s ago$/);
  });

  it("formats minutes / hours / days in the past", () => {
    expect(formatRelative(new Date(Date.now() - 5 * 60 * 1000))).toBe("5m ago");
    expect(formatRelative(new Date(Date.now() - 3 * 60 * 60 * 1000))).toBe("3h ago");
    expect(formatRelative(new Date(Date.now() - 2 * 86400 * 1000))).toBe("2d ago");
  });

  it("formats future dates as 'in X'", () => {
    expect(formatRelative(new Date(Date.now() + 5 * 60 * 1000))).toBe("in 5m");
    expect(formatRelative(new Date(Date.now() + 2 * 60 * 60 * 1000))).toBe("in 2h");
  });

  it("falls back to locale string for old/far-future dates", () => {
    const old = new Date(Date.now() - 30 * 86400 * 1000);
    expect(formatRelative(old)).toMatch(/\d/);
  });
});

describe("safeJsonParse", () => {
  it("returns the fallback on invalid JSON", () => {
    expect(safeJsonParse("not json", [])).toEqual([]);
    expect(safeJsonParse(null, { fallback: true })).toEqual({ fallback: true });
  });

  it("parses valid JSON", () => {
    expect(safeJsonParse('["a","b"]', [])).toEqual(["a", "b"]);
    expect(safeJsonParse('{"n":1}', {})).toEqual({ n: 1 });
  });
});

describe("maskApiKey", () => {
  it("masks long keys keeping head and tail", () => {
    expect(maskApiKey("sk-1234567890abcdef")).toBe("sk-1••••cdef");
  });

  it("returns dots for short keys", () => {
    expect(maskApiKey("abc")).toBe("••••");
  });
});

describe("slugify", () => {
  it("lowercases and replaces non-alphanum", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
    expect(slugify("Acme  Corp  --  v2")).toBe("acme-corp-v2");
  });

  it("trims leading/trailing dashes", () => {
    expect(slugify("---hello---")).toBe("hello");
  });
});
