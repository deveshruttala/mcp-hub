import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a date relative to "now". Handles both past ("3m ago") and future
 * ("in 2h") dates so cron `nextRunAt` values render correctly.
 */
export function formatRelative(d: Date | string | null | undefined) {
  if (!d) return "never";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const absSec = Math.floor(Math.abs(diffMs) / 1000);
  const future = diffMs < 0;

  let value: string;
  if (absSec < 60) value = `${absSec}s`;
  else if (absSec < 3600) value = `${Math.floor(absSec / 60)}m`;
  else if (absSec < 86400) value = `${Math.floor(absSec / 3600)}h`;
  else if (absSec < 604800) value = `${Math.floor(absSec / 86400)}d`;
  else return date.toLocaleDateString();

  return future ? `in ${value}` : `${value} ago`;
}

export function safeJsonParse<T = unknown>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function maskApiKey(key: string) {
  if (key.length < 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
