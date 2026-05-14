"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { encryptSecret } from "@/lib/crypto";
import { maskApiKey } from "@/lib/utils";

const schema = z.object({
  provider: z.string().min(1).max(40),
  name: z.string().min(1).max(80),
  value: z.string().min(8).max(2000),
});

export async function createApiKey(input: z.infer<typeof schema>) {
  const data = schema.parse(input);
  const { workspace } = await requireWorkspace();
  await prisma.apiKey.create({
    data: {
      workspaceId: workspace.id,
      provider: data.provider,
      name: data.name,
      maskedValue: maskApiKey(data.value),
      encrypted: encryptSecret(data.value),
    },
  });
  revalidatePath("/vault");
}

export async function revokeApiKey(id: string) {
  const { workspace } = await requireWorkspace();
  await prisma.apiKey.updateMany({
    where: { id, workspaceId: workspace.id },
    data: { status: "revoked" },
  });
  revalidatePath("/vault");
}

export async function deleteApiKey(id: string) {
  const { workspace } = await requireWorkspace();
  await prisma.apiKey.deleteMany({ where: { id, workspaceId: workspace.id } });
  revalidatePath("/vault");
}
