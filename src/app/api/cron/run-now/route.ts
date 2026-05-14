import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { runAgent } from "@/lib/services/execution";

const schema = z.object({ cronId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const member = await prisma.workspaceMember.findFirst({ where: { userId: session.user.id } });
  if (!member) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const job = await prisma.cronJob.findFirst({
    where: { id: parsed.data.cronId, workspaceId: member.workspaceId },
  });
  if (!job) return NextResponse.json({ error: "Cron not found" }, { status: 404 });

  const result = await runAgent({
    workspaceId: member.workspaceId,
    agentId: job.agentId,
    input: job.prompt,
  });
  await prisma.cronJob.update({ where: { id: job.id }, data: { lastRunAt: new Date() } });

  return NextResponse.json(result);
}
