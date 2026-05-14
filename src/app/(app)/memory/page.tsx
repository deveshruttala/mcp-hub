import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/layout/page-header";
import { MemoryClient } from "./memory-client";

export default async function MemoryPage() {
  const { workspace } = await requireWorkspace();
  const [items, agents] = await Promise.all([
    prisma.memoryItem.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { updatedAt: "desc" },
      include: { agent: true },
    }),
    prisma.agent.findMany({ where: { workspaceId: workspace.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Universal Memory"
        description="Write once, share across every agent and AI app. Search, edit, and preview agent context injection."
      />
      <MemoryClient
        initialItems={items.map((i) => ({
          id: i.id,
          title: i.title,
          content: i.content,
          type: i.type,
          visibility: i.visibility,
          agentId: i.agentId,
          agentName: i.agent?.name ?? null,
          updatedAt: i.updatedAt.toISOString(),
        }))}
        agents={agents.map((a) => ({ id: a.id, name: a.name }))}
      />
    </div>
  );
}
