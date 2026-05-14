import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/layout/page-header";
import { A2AClient } from "./a2a-client";

export default async function A2APage() {
  const { workspace } = await requireWorkspace();
  const [workflows, agents] = await Promise.all([
    prisma.a2AWorkflow.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      include: { steps: { orderBy: { position: "asc" }, include: { agent: true } } },
    }),
    prisma.agent.findMany({ where: { workspaceId: workspace.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="A2A workflows"
        description="Chain agents into deterministic pipelines: Research → Plan → Write → QA. Every step is logged."
      />
      <A2AClient
        agents={agents.map((a) => ({ id: a.id, name: a.name }))}
        workflows={workflows.map((w) => ({
          id: w.id,
          name: w.name,
          description: w.description,
          inputTask: w.inputTask,
          steps: w.steps.map((s) => ({ id: s.id, agentId: s.agentId, agentName: s.agent.name, prompt: s.prompt })),
        }))}
      />
    </div>
  );
}
