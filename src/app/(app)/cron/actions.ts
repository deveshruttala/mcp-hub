"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { runAgent } from "@/lib/services/execution";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(120),
  agentId: z.string().min(1),
  schedule: z.string().min(1).max(60),
  timezone: z.string().min(1).max(60).default("UTC"),
  prompt: z.string().min(1).max(2000),
  enabled: z.boolean().default(true),
  retryPolicy: z.enum(["none", "retry-3", "exponential"]).default("retry-3"),
});

export async function upsertCron(input: z.infer<typeof schema>) {
  const data = schema.parse(input);
  const { workspace } = await requireWorkspace();
  if (data.id) {
    await prisma.cronJob.update({
      where: { id: data.id },
      data: {
        name: data.name,
        agentId: data.agentId,
        schedule: data.schedule,
        timezone: data.timezone,
        prompt: data.prompt,
        enabled: data.enabled,
        retryPolicy: data.retryPolicy,
      },
    });
  } else {
    const next = new Date();
    next.setHours(next.getHours() + 6);
    await prisma.cronJob.create({
      data: {
        workspaceId: workspace.id,
        name: data.name,
        agentId: data.agentId,
        schedule: data.schedule,
        timezone: data.timezone,
        prompt: data.prompt,
        enabled: data.enabled,
        retryPolicy: data.retryPolicy,
        nextRunAt: next,
      },
    });
  }
  revalidatePath("/cron");
}

export async function toggleCron(id: string, enabled: boolean) {
  const { workspace } = await requireWorkspace();
  await prisma.cronJob.updateMany({
    where: { id, workspaceId: workspace.id },
    data: { enabled },
  });
  revalidatePath("/cron");
}

export async function deleteCron(id: string) {
  const { workspace } = await requireWorkspace();
  await prisma.cronJob.deleteMany({ where: { id, workspaceId: workspace.id } });
  revalidatePath("/cron");
}

export async function runCronNow(id: string) {
  const { workspace } = await requireWorkspace();
  const job = await prisma.cronJob.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!job) throw new Error("Cron not found");

  const result = await runAgent({ workspaceId: workspace.id, agentId: job.agentId, input: job.prompt });
  await prisma.cronJob.update({
    where: { id: job.id },
    data: { lastRunAt: new Date() },
  });
  revalidatePath("/cron");
  revalidatePath("/logs");
  return result;
}
