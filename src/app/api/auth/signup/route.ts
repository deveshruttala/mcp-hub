/**
 * POST /api/auth/signup
 * Creates a user, a workspace they own, and seeds their first membership.
 *
 * Rate-limited to 5 requests per minute per IP to discourage scripted abuse.
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { rateLimit, fingerprint } from "@/lib/services/rate-limit";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export async function POST(request: Request) {
  const limit = rateLimit(fingerprint(request, "signup"), { limit: 5, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many signup attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const lower = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: lower } });
  if (existing) {
    return NextResponse.json({ error: "Account already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email: lower,
      passwordHash,
    },
  });

  const slug = `${slugify(name)}-${user.id.slice(0, 6)}`;
  await prisma.workspace.create({
    data: {
      name: `${name}'s Workspace`,
      slug,
      members: { create: { userId: user.id, role: "owner" } },
    },
  });

  return NextResponse.json({ ok: true, userId: user.id });
}
