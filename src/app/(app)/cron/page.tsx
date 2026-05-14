import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/layout/page-header";
import { CronClient } from "./cron-client";

export default async function CronPage() {
  const { workspace } = await requireWorkspace();
  const [jobs, agents] = await Promise.all([
    prisma.cronJob.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      include: { agent: true },
    }),
    prisma.agent.findMany({ where: { workspaceId: workspace.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cron agents"
        description="Schedule recurring agent runs. Use the Run Now button to manually trigger them."
      />
      <CronClient
        agents={agents.map((a) => ({ id: a.id, name: a.name }))}
        jobs={jobs.map((j) => ({
          id: j.id,
          name: j.name,
          schedule: j.schedule,
          timezone: j.timezone,
          prompt: j.prompt,
          enabled: j.enabled,
          retryPolicy: j.retryPolicy,
          agentId: j.agentId,
          agentName: j.agent.name,
          lastRunAt: j.lastRunAt?.toISOString() ?? null,
          nextRunAt: j.nextRunAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
