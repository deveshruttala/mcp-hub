import { describe, it, expect } from "vitest";
import { PERMISSIONS, checkPermissions } from "@/lib/permissions";

describe("PERMISSIONS catalog", () => {
  it("exposes the full permission set", () => {
    expect(PERMISSIONS.length).toBeGreaterThanOrEqual(13);
    const slugs = PERMISSIONS.map((p) => p.slug);
    expect(slugs).toContain("read_email");
    expect(slugs).toContain("write_code");
    expect(slugs).toContain("use_memory");
    expect(slugs).toContain("call_other_agents");
  });

  it("every permission has a label and description", () => {
    for (const p of PERMISSIONS) {
      expect(p.slug).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.description).toBeTruthy();
    }
  });
});

describe("checkPermissions", () => {
  it("passes when all required are granted", () => {
    expect(checkPermissions(["read_email", "use_memory"], ["read_email"])).toEqual({ ok: true });
    expect(checkPermissions(["read_email", "use_memory"], [])).toEqual({ ok: true });
  });

  it("reports missing permissions", () => {
    const result = checkPermissions(["read_email"], ["read_email", "send_email"]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.missing).toEqual(["send_email"]);
  });

  it("handles empty grants with required perms", () => {
    const result = checkPermissions([], ["use_memory"]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.missing).toEqual(["use_memory"]);
  });
});
