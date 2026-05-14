import Link from "next/link";
import { Bot, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { safeJsonParse } from "@/lib/utils";

export default async function AgentsPage() {
  const { workspace } = await requireWorkspace();
  const agents = await prisma.agent.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { executions: true, cronJobs: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        description="Compose agents with system instructions, allowed tools, scoped memory, and permissions."
        action={
          <Button asChild>
            <Link href="/agents/new">
              <Plus className="mr-1 h-4 w-4" /> New agent
            </Link>
          </Button>
        }
      />
      {agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No agents yet"
          description="Create your first agent to start orchestrating tools, memory, and permissions."
          action={
            <Button asChild>
              <Link href="/agents/new">Create agent</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => {
            const tools = safeJsonParse<string[]>(a.allowedTools, []);
            return (
              <Link key={a.id} href={`/agents/${a.id}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.model}</p>
                        </div>
                      </div>
                      <Badge variant={a.status === "active" ? "success" : "outline"}>{a.status}</Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-[10px]">{a.executionMode}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{tools.length} tools</Badge>
                      <Badge variant="secondary" className="text-[10px]">{a._count.executions} runs</Badge>
                      <Badge variant="secondary" className="text-[10px]">{a._count.cronJobs} crons</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
