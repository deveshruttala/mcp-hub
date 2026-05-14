import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative, safeJsonParse } from "@/lib/utils";
import { ConnectionActions } from "./connection-actions";

const PROVIDERS = [
  { slug: "google", name: "Google", description: "Gmail, Calendar, Drive" },
  { slug: "github", name: "GitHub", description: "Repos, Issues, PRs" },
  { slug: "slack", name: "Slack", description: "Channels and DMs" },
  { slug: "notion", name: "Notion", description: "Pages and databases" },
  { slug: "stripe", name: "Stripe", description: "Payments and subscriptions" },
  { slug: "linear", name: "Linear", description: "Issues and projects" },
  { slug: "supabase", name: "Supabase", description: "DB, storage, auth" },
  { slug: "custom", name: "Custom API Key", description: "Bring your own service" },
];

export default async function ConnectionsPage() {
  const { workspace } = await requireWorkspace();
  const connections = await prisma.connection.findMany({
    where: { workspaceId: workspace.id },
  });
  const map = new Map(connections.map((c) => [c.provider, c]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connections"
        description="Authenticate once. Every agent and AI app can call these connections through AgentHub."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PROVIDERS.map((p) => {
          const conn = map.get(p.slug);
          const scopes = conn ? safeJsonParse<string[]>(conn.scopes, []) : [];
          const connected = !!conn && conn.status === "connected";
          return (
            <Card key={p.slug}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </div>
                  <Badge variant={connected ? "success" : "outline"}>
                    {connected ? "connected" : "not connected"}
                  </Badge>
                </div>
                <dl className="space-y-1 rounded-md border bg-muted/20 p-3 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Account</dt>
                    <dd className="truncate">{conn?.accountName ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Token</dt>
                    <dd>{conn?.tokenStatus ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Last synced</dt>
                    <dd>{formatRelative(conn?.lastSyncedAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Scopes</dt>
                    <dd className="truncate text-right">{scopes.length ? scopes.join(", ") : "—"}</dd>
                  </div>
                </dl>
                <ConnectionActions provider={p.slug} connected={connected} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
