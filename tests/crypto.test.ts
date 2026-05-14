import { describe, it, expect, beforeAll } from "vitest";
import { encryptSecret, decryptSecret } from "@/lib/crypto";

beforeAll(() => {
  process.env.AUTH_SECRET = "deterministic-test-secret-for-vitest";
});

describe("encryptSecret / decryptSecret", () => {
  it("round-trips an arbitrary string", () => {
    const plain = "sk-1234567890abcdefghij";
    const cipher = encryptSecret(plain);
    expect(cipher).not.toBe(plain);
    expect(decryptSecret(cipher)).toBe(plain);
  });

  it("produces different ciphertexts for the same plaintext (random IV)", () => {
    const plain = "hello world";
    const a = encryptSecret(plain);
    const b = encryptSecret(plain);
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe(plain);
    expect(decryptSecret(b)).toBe(plain);
  });

  it("handles unicode payloads", () => {
    const plain = "héllo 世界 🚀";
    expect(decryptSecret(encryptSecret(plain))).toBe(plain);
  });

  it("throws on tampered ciphertext", () => {
    const cipher = encryptSecret("secret");
    // Flip a byte in the middle of the auth-tag region
    const buf = Buffer.from(cipher, "base64");
    buf[15] = buf[15] ^ 0xff;
    expect(() => decryptSecret(buf.toString("base64"))).toThrow();
  });
});
