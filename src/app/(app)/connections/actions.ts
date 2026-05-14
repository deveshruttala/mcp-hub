"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";

export async function connectProvider(provider: string) {
  const { workspace, user } = await requireWorkspace();
  const existing = await prisma.connection.findFirst({
    where: { workspaceId: workspace.id, provider },
  });
  if (existing) {
    await prisma.connection.update({
      where: { id: existing.id },
      data: { status: "connected", lastSyncedAt: new Date(), tokenStatus: "active" },
    });
  } else {
    await prisma.connection.create({
      data: {
        workspaceId: workspace.id,
        provider,
        accountName: user.email ?? `${provider}-account`,
        scopes: JSON.stringify(["read", "write"]),
        status: "connected",
        tokenStatus: "active",
        lastSyncedAt: new Date(),
      },
    });
  }
  revalidatePath("/connections");
  revalidatePath("/dashboard");
}

export async function disconnectProvider(provider: string) {
  const { workspace } = await requireWorkspace();
  await prisma.connection.deleteMany({
    where: { workspaceId: workspace.id, provider },
  });
  revalidatePath("/connections");
  revalidatePath("/dashboard");
}
