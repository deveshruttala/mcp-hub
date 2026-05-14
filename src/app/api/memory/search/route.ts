import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { searchMemory } from "@/lib/services/memory";

const schema = z.object({ query: z.string().min(1), agentId: z.string().optional(), limit: z.number().int().min(1).max(20).optional() });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const member = await prisma.workspaceMember.findFirst({ where: { userId: session.user.id } });
  if (!member) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const results = await searchMemory({
    workspaceId: member.workspaceId,
    query: parsed.data.query,
    agentId: parsed.data.agentId,
    limit: parsed.data.limit ?? 5,
  });

  return NextResponse.json({
    results: results.map((r) => ({
      id: r.item.id,
      title: r.item.title,
      content: r.item.content,
      type: r.item.type,
      visibility: r.item.visibility,
      score: Number(r.score.toFixed(3)),
    })),
  });
}
