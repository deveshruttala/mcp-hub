/**
 * Centralised permission catalog.
 *
 * Every tool declares the permissions it requires. Every agent declares the
 * permissions granted to it. Before each execution the engine intersects the
 * sets — missing permissions deny the call with a structured error written
 * to the execution log.
 *
 * Adding a new permission slug is a one-line change here; UI components
 * iterate over `PERMISSIONS` to render labels and descriptions.
 */

export const PERMISSIONS = [
  { slug: "read_email", label: "Read email", description: "Read messages from connected email providers" },
  { slug: "send_email", label: "Send email", description: "Send messages on behalf of the user" },
  { slug: "read_calendar", label: "Read calendar", description: "Read calendar events" },
  { slug: "write_calendar", label: "Write calendar", description: "Create or modify calendar events" },
  { slug: "read_files", label: "Read files", description: "Read user files and documents" },
  { slug: "write_files", label: "Write files", description: "Create or modify user files" },
  { slug: "read_code", label: "Read code", description: "Read repository contents" },
  { slug: "write_code", label: "Write code", description: "Create commits, branches, or pull requests" },
  { slug: "access_payments", label: "Access payments", description: "Read or trigger payment data" },
  { slug: "external_web", label: "External web access", description: "Make outbound web requests" },
  { slug: "run_code", label: "Run code", description: "Execute sandboxed code" },
  { slug: "use_memory", label: "Use memory", description: "Read and write workspace memory" },
  { slug: "call_other_agents", label: "Call other agents", description: "Invoke agents in A2A workflows" },
] as const;

export type PermissionSlug = (typeof PERMISSIONS)[number]["slug"];

export function checkPermissions(
  granted: string[],
  required: string[],
): { ok: true } | { ok: false; missing: string[] } {
  const missing = required.filter((p) => !granted.includes(p));
  if (missing.length === 0) return { ok: true };
  return { ok: false, missing };
}
