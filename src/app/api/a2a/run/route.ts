import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { runWorkflow } from "@/lib/services/execution";

const schema = z.object({
  workflowId: z.string().min(1),
  inputTask: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const member = await prisma.workspaceMember.findFirst({ where: { userId: session.user.id } });
  if (!member) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  try {
    const result = await runWorkflow({
      workspaceId: member.workspaceId,
      workflowId: parsed.data.workflowId,
      inputTask: parsed.data.inputTask,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Workflow failed" }, { status: 400 });
  }
}
