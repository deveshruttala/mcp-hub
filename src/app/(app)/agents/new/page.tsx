import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/layout/page-header";
import { PERMISSIONS } from "@/lib/permissions";
import { AgentForm } from "../agent-form";

export default async function NewAgentPage() {
  const { workspace } = await requireWorkspace();
  const installed = await prisma.installedTool.findMany({
    where: { workspaceId: workspace.id },
    include: { tool: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="New agent" description="Compose a fresh AI agent in your workspace." />
      <AgentForm
        tools={installed.map((i) => ({ slug: i.tool.slug, name: i.tool.name }))}
        permissions={PERMISSIONS.map((p) => ({ slug: p.slug, label: p.label }))}
      />
    </div>
  );
}
