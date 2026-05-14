"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { buildEmbedding, searchMemory } from "@/lib/services/memory";

const memorySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(120),
  content: z.string().min(1).max(4000),
  type: z.enum([
    "user_preference",
    "project_context",
    "company_knowledge",
    "agent_instruction",
    "tool_usage",
    "long_term_note",
  ]),
  visibility: z.enum(["private", "team", "agent"]),
  agentId: z.string().optional().nullable(),
});

export async function upsertMemory(input: z.infer<typeof memorySchema>) {
  const data = memorySchema.parse(input);
  const { workspace } = await requireWorkspace();
  const embedding = JSON.stringify(buildEmbedding(`${data.title} ${data.content}`));

  if (data.id) {
    await prisma.memoryItem.update({
      where: { id: data.id },
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        visibility: data.visibility,
        agentId: data.agentId || null,
        embedding,
      },
    });
  } else {
    await prisma.memoryItem.create({
      data: {
        workspaceId: workspace.id,
        title: data.title,
        content: data.content,
        type: data.type,
        visibility: data.visibility,
        agentId: data.agentId || null,
        embedding,
      },
    });
  }
  revalidatePath("/memory");
}

export async function deleteMemory(id: string) {
  const { workspace } = await requireWorkspace();
  await prisma.memoryItem.deleteMany({ where: { id, workspaceId: workspace.id } });
  revalidatePath("/memory");
}

export async function searchWorkspaceMemory(query: string) {
  const { workspace } = await requireWorkspace();
  const results = await searchMemory({ workspaceId: workspace.id, query, limit: 8 });
  return results.map((r) => ({
    id: r.item.id,
    title: r.item.title,
    content: r.item.content,
    score: Number(r.score.toFixed(3)),
  }));
}
