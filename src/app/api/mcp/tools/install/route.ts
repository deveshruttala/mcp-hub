import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const schema = z.object({ slug: z.string().min(1) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const member = await prisma.workspaceMember.findFirst({ where: { userId: session.user.id } });
  if (!member) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const tool = await prisma.tool.findUnique({ where: { slug: parsed.data.slug } });
  if (!tool) return NextResponse.json({ error: "Tool not found" }, { status: 404 });

  await prisma.installedTool.upsert({
    where: { workspaceId_toolId: { workspaceId: member.workspaceId, toolId: tool.id } },
    update: { enabled: true },
    create: { workspaceId: member.workspaceId, toolId: tool.id },
  });

  return NextResponse.json({ ok: true });
}
