import { describe, it, expect } from "vitest";
import { buildEmbedding } from "@/lib/services/memory";

describe("buildEmbedding", () => {
  it("returns a token-frequency map", () => {
    const e = buildEmbedding("Hello hello WORLD!");
    expect(e.hello).toBe(2);
    expect(e.world).toBe(1);
  });

  it("ignores short tokens (< 3 chars)", () => {
    const e = buildEmbedding("a an the quick fox");
    expect(e.a).toBeUndefined();
    expect(e.an).toBeUndefined();
    expect(e.the).toBe(1);
    expect(e.quick).toBe(1);
  });

  it("strips punctuation", () => {
    const e = buildEmbedding("MRR! grew, 6.4% MoM.");
    expect(e.mrr).toBe(1);
    expect(e.grew).toBe(1);
    expect(e.mom).toBe(1);
  });

  it("returns empty map for empty input", () => {
    expect(buildEmbedding("")).toEqual({});
    expect(buildEmbedding("   !!! ")).toEqual({});
  });
});
