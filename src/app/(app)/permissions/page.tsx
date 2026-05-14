import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS } from "@/lib/permissions";
import { safeJsonParse } from "@/lib/utils";

export default async function PermissionsPage() {
  const { workspace } = await requireWorkspace();
  const [agents, tools] = await Promise.all([
    prisma.agent.findMany({ where: { workspaceId: workspace.id } }),
    prisma.tool.findMany(),
  ]);

  const agentByPerm = new Map<string, string[]>();
  for (const agent of agents) {
    for (const p of safeJsonParse<string[]>(agent.permissions, [])) {
      const arr = agentByPerm.get(p) ?? [];
      arr.push(agent.name);
      agentByPerm.set(p, arr);
    }
  }
  const toolByPerm = new Map<string, string[]>();
  for (const tool of tools) {
    for (const p of safeJsonParse<string[]>(tool.permissions, [])) {
      const arr = toolByPerm.get(p) ?? [];
      arr.push(tool.name);
      toolByPerm.set(p, arr);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="Granular permission slugs are checked before every agent execution. Missing permissions deny the call."
      />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {PERMISSIONS.map((p) => (
          <Card key={p.slug}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{p.label}</CardTitle>
                <Badge variant="outline" className="text-[10px]">{p.slug}</Badge>
              </div>
              <CardDescription>{p.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div>
                <p className="font-medium text-foreground">Agents granted</p>
                <p className="text-muted-foreground">
                  {(agentByPerm.get(p.slug) ?? []).join(", ") || "none"}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Required by tools</p>
                <p className="text-muted-foreground">
                  {(toolByPerm.get(p.slug) ?? []).join(", ") || "none"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
