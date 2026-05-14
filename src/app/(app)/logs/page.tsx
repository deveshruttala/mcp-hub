import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollText } from "lucide-react";
import { formatDate, safeJsonParse } from "@/lib/utils";

interface SearchParams {
  agent?: string;
  status?: string;
  tool?: string;
}

export default async function LogsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { workspace } = await requireWorkspace();
  const agents = await prisma.agent.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { name: "asc" },
  });

  const where: Record<string, unknown> = { workspaceId: workspace.id };
  if (params.agent) where.agentId = params.agent;
  if (params.status) where.status = params.status;
  if (params.tool) where.toolsUsed = { contains: params.tool };

  const logs = await prisma.executionLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { agent: true },
    take: 80,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Execution logs" description="Every agent run is logged with tools, memory, latency, and cost." />

      <Card>
        <CardContent className="p-4">
          <form className="grid gap-2 md:grid-cols-4" method="get">
            <select name="agent" defaultValue={params.agent ?? ""} className="rounded-md border bg-transparent px-3 py-1.5 text-sm">
              <option value="">All agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <select name="status" defaultValue={params.status ?? ""} className="rounded-md border bg-transparent px-3 py-1.5 text-sm">
              <option value="">Any status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="running">Running</option>
            </select>
            <input
              name="tool"
              defaultValue={params.tool ?? ""}
              placeholder="Tool slug filter…"
              className="rounded-md border bg-transparent px-3 py-1.5 text-sm"
            />
            <button type="submit" className="rounded-md border bg-primary px-3 py-1.5 text-sm text-primary-foreground">
              Apply filters
            </button>
          </form>
        </CardContent>
      </Card>

      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No logs match" description="Run an agent or adjust your filters." />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const tools = safeJsonParse<string[]>(log.toolsUsed, []);
            const memory = safeJsonParse<string[]>(log.memoryUsed, []);
            return (
              <Card key={log.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{log.agent?.name ?? "Workflow"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <Badge variant={log.status === "success" ? "success" : log.status === "error" ? "destructive" : "info"}>
                        {log.status}
                      </Badge>
                      <Badge variant="secondary">{log.latencyMs}ms</Badge>
                      <Badge variant="secondary">${log.estimatedCost.toFixed(4)}</Badge>
                      <Badge variant="info">{tools.length} tools</Badge>
                      <Badge variant="info">{memory.length} memory</Badge>
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-2 text-xs">
                    <p className="font-medium">Input</p>
                    <p className="text-muted-foreground">{log.input}</p>
                  </div>
                  {(log.output || log.errorMessage) && (
                    <div className="rounded-md border bg-muted/20 p-2 text-xs">
                      <p className="font-medium">{log.errorMessage ? "Error" : "Output"}</p>
                      <pre className="line-clamp-6 whitespace-pre-wrap text-muted-foreground">
                        {log.errorMessage ?? log.output}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
