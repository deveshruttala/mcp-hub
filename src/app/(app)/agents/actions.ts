"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { runAgent } from "@/lib/services/execution";

const agentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(280),
  systemInstructions: z.string().min(1).max(4000),
  model: z.string().default("gpt-4o-mini"),
  allowedTools: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
  memoryAccess: z.enum(["all", "linked", "none"]).default("all"),
  budgetLimit: z.number().min(0).default(10),
  executionMode: z.enum(["manual", "cron", "event"]).default("manual"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export async function upsertAgent(input: z.infer<typeof agentSchema>) {
  const data = agentSchema.parse(input);
  const { workspace } = await requireWorkspace();

  if (data.id) {
    await prisma.agent.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        systemInstructions: data.systemInstructions,
        model: data.model,
        allowedTools: JSON.stringify(data.allowedTools),
        permissions: JSON.stringify(data.permissions),
        memoryAccess: data.memoryAccess,
        budgetLimit: data.budgetLimit,
        executionMode: data.executionMode,
        status: data.status,
      },
    });
    revalidatePath(`/agents/${data.id}`);
    revalidatePath("/agents");
    return { id: data.id };
  }

  const agent = await prisma.agent.create({
    data: {
      workspaceId: workspace.id,
      name: data.name,
      description: data.description,
      systemInstructions: data.systemInstructions,
      model: data.model,
      allowedTools: JSON.stringify(data.allowedTools),
      permissions: JSON.stringify(data.permissions),
      memoryAccess: data.memoryAccess,
      budgetLimit: data.budgetLimit,
      executionMode: data.executionMode,
      status: data.status,
    },
  });
  revalidatePath("/agents");
  return { id: agent.id };
}

export async function deleteAgent(id: string) {
  const { workspace } = await requireWorkspace();
  await prisma.agent.deleteMany({ where: { id, workspaceId: workspace.id } });
  revalidatePath("/agents");
  redirect("/agents");
}

export async function testRunAgent(agentId: string, input: string) {
  const { workspace } = await requireWorkspace();
  const result = await runAgent({ workspaceId: workspace.id, agentId, input });
  revalidatePath(`/agents/${agentId}`);
  revalidatePath("/logs");
  return result;
}
