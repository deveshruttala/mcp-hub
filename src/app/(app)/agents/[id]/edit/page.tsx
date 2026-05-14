import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/layout/page-header";
import { PERMISSIONS } from "@/lib/permissions";
import { safeJsonParse } from "@/lib/utils";
import { AgentForm } from "../../agent-form";

export default async function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireWorkspace();
  const [agent, installed] = await Promise.all([
    prisma.agent.findFirst({ where: { id, workspaceId: workspace.id } }),
    prisma.installedTool.findMany({
      where: { workspaceId: workspace.id },
      include: { tool: true },
    }),
  ]);
  if (!agent) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${agent.name}`} description="Update permissions, allowed tools, or instructions." />
      <AgentForm
        agent={{
          id: agent.id,
          name: agent.name,
          description: agent.description,
          systemInstructions: agent.systemInstructions,
          model: agent.model,
          allowedTools: safeJsonParse<string[]>(agent.allowedTools, []),
          permissions: safeJsonParse<string[]>(agent.permissions, []),
          memoryAccess: agent.memoryAccess,
          budgetLimit: agent.budgetLimit,
          executionMode: agent.executionMode,
          status: agent.status,
        }}
        tools={installed.map((i) => ({ slug: i.tool.slug, name: i.tool.name }))}
        permissions={PERMISSIONS.map((p) => ({ slug: p.slug, label: p.label }))}
      />
    </div>
  );
}
