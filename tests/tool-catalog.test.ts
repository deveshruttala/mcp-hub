import { describe, it, expect } from "vitest";
import { TOOL_CATALOG, TOOL_COUNT, categories } from "@/lib/data/tool-catalog";
import { PERMISSIONS } from "@/lib/permissions";

describe("tool catalog", () => {
  it("contains at least 100 entries", () => {
    expect(TOOL_COUNT).toBeGreaterThanOrEqual(100);
    expect(TOOL_CATALOG.length).toBe(TOOL_COUNT);
  });

  it("has unique slugs across the catalog", () => {
    const slugs = TOOL_CATALOG.map((t) => t.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("every tool has all required fields", () => {
    for (const t of TOOL_CATALOG) {
      expect(t.slug).toMatch(/^[a-z0-9-]+$/);
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(t.endpoint).toMatch(/^https?:\/\//);
      expect(t.rating).toBeGreaterThanOrEqual(1);
      expect(t.rating).toBeLessThanOrEqual(5);
      expect(["stable", "beta", "alpha"]).toContain(t.status);
      expect(Array.isArray(t.permissions)).toBe(true);
    }
  });

  it("every declared permission exists in the global catalog", () => {
    const known = new Set(PERMISSIONS.map((p) => p.slug));
    for (const t of TOOL_CATALOG) {
      for (const p of t.permissions) {
        expect(known.has(p), `Tool ${t.slug} declares unknown permission ${p}`).toBe(true);
      }
    }
  });

  it("categories() returns each category exactly once", () => {
    const cats = categories();
    expect(new Set(cats).size).toBe(cats.length);
    expect(cats.length).toBeGreaterThanOrEqual(10);
  });

  it("includes key starter tools every workspace should ship with", () => {
    const slugs = TOOL_CATALOG.map((t) => t.slug);
    for (const expected of [
      "gmail-reader",
      "google-calendar",
      "github-issue-agent",
      "slack-summarizer",
      "notion-knowledge-base",
      "stripe-revenue",
      "openai-chat",
      "anthropic-claude",
      "postgres-sql",
    ]) {
      expect(slugs).toContain(expected);
    }
  });
});
