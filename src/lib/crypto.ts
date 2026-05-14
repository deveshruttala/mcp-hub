/**
 * Encryption abstraction for AgentHub
 * ----------------------------------------------------------------------------
 * Uses AES-256-GCM from Node's built-in `crypto` module so that production
 * deployments do not need any third-party dependency. The encryption key is
 * derived from `AUTH_SECRET` via SHA-256 and salted with a constant
 * application-level value — this means rotating `AUTH_SECRET` invalidates all
 * vault entries, which is the desired behaviour for an MVP.
 *
 * Format of the ciphertext returned by `encryptSecret`:
 *   base64( iv (12) || authTag (16) || ciphertext )
 *
 * For higher security in production, replace the local key derivation with
 * AWS KMS / GCP KMS / HashiCorp Vault and store the wrapped data key per
 * workspace.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function deriveKey(): Buffer {
  const secret = process.env.AUTH_SECRET ?? "agenthub-dev-secret-change-me";
  // SHA-256 yields exactly 32 bytes — perfect for AES-256.
  return createHash("sha256").update(`agenthub::${secret}`).digest().subarray(0, KEY_LENGTH);
}

/** Encrypt a UTF-8 plaintext into a base64-encoded sealed envelope. */
export function encryptSecret(plain: string): string {
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

/** Decrypt a sealed envelope previously produced by `encryptSecret`. */
export function decryptSecret(envelope: string): string {
  const buf = Buffer.from(envelope, "base64");
  if (buf.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("crypto: ciphertext too short");
  }
  const key = deriveKey();
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
