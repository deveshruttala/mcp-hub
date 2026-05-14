"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { runWorkflow } from "@/lib/services/execution";

const workflowSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(80),
  description: z.string().optional(),
  inputTask: z.string().optional(),
  steps: z.array(z.object({ agentId: z.string(), prompt: z.string().optional() })).min(1),
});

export async function upsertWorkflow(input: z.infer<typeof workflowSchema>) {
  const data = workflowSchema.parse(input);
  const { workspace } = await requireWorkspace();

  if (data.id) {
    await prisma.a2AWorkflowStep.deleteMany({ where: { workflowId: data.id } });
    await prisma.a2AWorkflow.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description ?? null,
        inputTask: data.inputTask ?? null,
        steps: {
          create: data.steps.map((s, idx) => ({
            agentId: s.agentId,
            position: idx,
            prompt: s.prompt ?? null,
          })),
        },
      },
    });
    revalidatePath("/a2a");
    return { id: data.id };
  }

  const wf = await prisma.a2AWorkflow.create({
    data: {
      workspaceId: workspace.id,
      name: data.name,
      description: data.description ?? null,
      inputTask: data.inputTask ?? null,
      steps: {
        create: data.steps.map((s, idx) => ({
          agentId: s.agentId,
          position: idx,
          prompt: s.prompt ?? null,
        })),
      },
    },
  });
  revalidatePath("/a2a");
  return { id: wf.id };
}

export async function deleteWorkflow(id: string) {
  const { workspace } = await requireWorkspace();
  await prisma.a2AWorkflow.deleteMany({ where: { id, workspaceId: workspace.id } });
  revalidatePath("/a2a");
}

export async function runWorkflowNow(id: string, inputTask: string) {
  const { workspace } = await requireWorkspace();
  const result = await runWorkflow({ workspaceId: workspace.id, workflowId: id, inputTask });
  revalidatePath("/a2a");
  revalidatePath("/logs");
  return result;
}
