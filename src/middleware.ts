/**
 * Edge middleware
 * ----------------------------------------------------------------------------
 * Adds defensive security headers to every response. We avoid running any
 * database / NextAuth code here because middleware executes on the Edge
 * runtime — auth gating is performed inside server components via
 * `requireWorkspace()` and inside API routes via `auth()`.
 */

import { NextResponse, type NextRequest } from "next/server";

const SECURITY_HEADERS: Record<string, string> = {
  // Tell the browser to enforce HTTPS once it has seen a secure response.
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  // Disable MIME-sniffing.
  "X-Content-Type-Options": "nosniff",
  // Prevent clickjacking via iframe embedding.
  "X-Frame-Options": "DENY",
  // Strict referrer policy reduces leakage of internal URLs.
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Cross-Origin Opener Policy makes window.opener attacks harder.
  "Cross-Origin-Opener-Policy": "same-origin",
  // Disable browser features the app does not need.
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export function middleware(_request: NextRequest) {
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  // Run on every page and API route, skipping Next.js internals + static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|txt)).*)"],
};
