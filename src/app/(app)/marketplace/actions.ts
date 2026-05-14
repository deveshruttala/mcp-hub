"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";

export async function installTool(toolId: string) {
  const { workspace } = await requireWorkspace();
  await prisma.installedTool.upsert({
    where: { workspaceId_toolId: { workspaceId: workspace.id, toolId } },
    update: { enabled: true },
    create: { workspaceId: workspace.id, toolId },
  });
  revalidatePath("/marketplace");
  revalidatePath("/dashboard");
}

export async function uninstallTool(toolId: string) {
  const { workspace } = await requireWorkspace();
  await prisma.installedTool.deleteMany({
    where: { workspaceId: workspace.id, toolId },
  });
  revalidatePath("/marketplace");
  revalidatePath("/dashboard");
}
