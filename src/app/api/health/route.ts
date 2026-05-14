/**
 * GET /api/health
 *
 * Lightweight health check used by load balancers and uptime monitors.
 * Performs a `SELECT 1` round-trip against the database so a green response
 * implies both the Node runtime and the database are reachable.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      uptimeMs: process.uptime() * 1000,
      latencyMs: Date.now() - startedAt,
      version: process.env.npm_package_version ?? "0.1.0",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "degraded",
        error: err instanceof Error ? err.message : "unknown",
        latencyMs: Date.now() - startedAt,
      },
      { status: 503 },
    );
  }
}
