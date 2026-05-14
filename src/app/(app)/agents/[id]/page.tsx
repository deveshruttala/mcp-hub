import { notFound } from "next/navigation";
import Link from "next/link";
import { Bot, Pencil, Play, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelative, safeJsonParse } from "@/lib/utils";
import { AgentRunner } from "./agent-runner";
import { DeleteAgentButton } from "./delete-agent-button";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireWorkspace();
  const agent = await prisma.agent.findFirst({
    where: { id, workspaceId: workspace.id },
    include: {
      executions: { orderBy: { createdAt: "desc" }, take: 5 },
      cronJobs: true,
    },
  });
  if (!agent) notFound();

  const tools = safeJsonParse<string[]>(agent.allowedTools, []);
  const permissions = safeJsonParse<string[]>(agent.permissions, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={agent.name}
        description={agent.description}
        action={
          <>
            <Button variant="outline" asChild>
              <Link href={`/agents/${agent.id}/edit`}>
                <Pencil className="mr-1 h-4 w-4" /> Edit
              </Link>
            </Button>
            <DeleteAgentButton id={agent.id} />
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Model" value={agent.model} />
            <Row label="Mode" value={agent.executionMode} />
            <Row label="Status" value={<Badge variant={agent.status === "active" ? "success" : "outline"}>{agent.status}</Badge>} />
            <Row label="Memory access" value={agent.memoryAccess} />
            <Row label="Budget" value={`$${agent.budgetLimit.toFixed(2)} / mo`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Allowed tools</CardTitle>
            <CardDescription>{tools.length} tools attached</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {tools.length === 0 && <p className="text-xs text-muted-foreground">No tools allowed.</p>}
            {tools.map((t) => (
              <Badge key={t} variant="secondary">{t}</Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permissions</CardTitle>
            <CardDescription>{permissions.length} permission(s) granted</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {permissions.length === 0 && <p className="text-xs text-muted-foreground">No permissions granted.</p>}
            {permissions.map((p) => (
              <Badge key={p} variant="info">{p}</Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Play className="h-4 w-4" /> Test run
          </CardTitle>
          <CardDescription>
            Simulate execution. The runtime checks permissions, retrieves allowed memory, calls tools, and writes a log.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgentRunner agentId={agent.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {agent.executions.length === 0 && <p className="text-sm text-muted-foreground">No runs yet.</p>}
          {agent.executions.map((log) => (
            <div key={log.id} className="rounded-md border bg-muted/20 p-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="truncate font-medium">{log.input}</p>
                <Badge variant={log.status === "success" ? "success" : log.status === "error" ? "destructive" : "info"}>
                  {log.status}
                </Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{log.output ?? log.errorMessage}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatRelative(log.createdAt)} · {log.latencyMs}ms · ${log.estimatedCost.toFixed(4)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {agent.cronJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agent.cronJobs.map((c) => (
              <div key={c.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.schedule} · {c.timezone} · next: {formatRelative(c.nextRunAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
