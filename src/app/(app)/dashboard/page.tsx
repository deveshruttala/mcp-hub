import Link from "next/link";
import { Bot, Brain, Clock, Plug, ScrollText, Sparkles, Store, Workflow } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/utils";

export default async function DashboardPage() {
  const { workspace } = await requireWorkspace();

  // Dashboard counts — Promise.all keeps the page snappy on first load.
  const [agents, installed, connections, memoryCount, executions, crons, workflows, recentLogs] = await Promise.all([
    prisma.agent.count({ where: { workspaceId: workspace.id } }),
    prisma.installedTool.count({ where: { workspaceId: workspace.id } }),
    prisma.connection.count({ where: { workspaceId: workspace.id, status: "connected" } }),
    prisma.memoryItem.count({ where: { workspaceId: workspace.id } }),
    prisma.executionLog.count({ where: { workspaceId: workspace.id } }),
    prisma.cronJob.count({ where: { workspaceId: workspace.id, enabled: true } }),
    prisma.a2AWorkflow.count({ where: { workspaceId: workspace.id } }),
    prisma.executionLog.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { agent: true },
    }),
  ]);

  const monthlySpend = await prisma.executionLog.aggregate({
    where: { workspaceId: workspace.id },
    _sum: { estimatedCost: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back to ${workspace.name}`}
        description="Operate your AI agents from one place — connect tools, write memory, run flows."
        action={
          <>
            <Button variant="outline" asChild>
              <Link href="/marketplace">
                <Store className="mr-1 h-4 w-4" /> Add tools
              </Link>
            </Button>
            <Button asChild>
              <Link href="/agents/new">
                <Sparkles className="mr-1 h-4 w-4" /> New agent
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total agents" value={agents} icon={Bot} hint="Active in workspace" />
        <StatCard label="Installed MCP tools" value={installed} icon={Store} />
        <StatCard label="Connected apps" value={connections} icon={Plug} />
        <StatCard label="Memory items" value={memoryCount} icon={Brain} />
        <StatCard label="Executions (all-time)" value={executions} icon={ScrollText} />
        <StatCard label="Active cron agents" value={crons} icon={Clock} />
        <StatCard label="A2A workflows" value={workflows} icon={Workflow} />
        <StatCard
          label="Estimated monthly usage"
          value={`$${(monthlySpend._sum.estimatedCost ?? 0).toFixed(2)}`}
          icon={Sparkles}
          hint="Across all agents"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent executions</CardTitle>
            <CardDescription>Last 6 agent runs across this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLogs.length === 0 && (
              <p className="text-sm text-muted-foreground">No executions yet — run an agent to see logs here.</p>
            )}
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{log.agent?.name ?? "Workflow"}</p>
                  <p className="truncate text-xs text-muted-foreground">{log.input}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Badge
                    variant={log.status === "success" ? "success" : log.status === "error" ? "destructive" : "info"}
                  >
                    {log.status}
                  </Badge>
                  <span>{formatRelative(log.createdAt)}</span>
                </div>
              </div>
            ))}
            <div className="pt-2">
              <Link href="/logs" className="text-xs text-muted-foreground underline">
                View all logs →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Spin up the building blocks of your hub.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/marketplace">
                <Store className="mr-2 h-4 w-4" /> Browse MCP marketplace
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/connections">
                <Plug className="mr-2 h-4 w-4" /> Connect a service
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/memory">
                <Brain className="mr-2 h-4 w-4" /> Add memory
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/cron">
                <Clock className="mr-2 h-4 w-4" /> Schedule a cron
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/a2a">
                <Workflow className="mr-2 h-4 w-4" /> Build A2A workflow
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
