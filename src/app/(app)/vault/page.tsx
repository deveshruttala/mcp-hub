import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { CreateKeyButton, KeyActions } from "./vault-client";

export default async function VaultPage() {
  const { workspace } = await requireWorkspace();
  const keys = await prisma.apiKey.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Key Vault"
        description="Store API keys once. Masked everywhere. Encrypted at rest with the workspace key."
        action={<CreateKeyButton />}
      />

      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-medium">Sensitive area</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
              Once saved, the full key is encrypted and can never be revealed in the UI. Use revoke to disable a key
              without deleting its audit trail.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {keys.map((k) => (
          <Card key={k.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{k.name}</p>
                  <p className="text-xs text-muted-foreground">{k.provider}</p>
                </div>
                <Badge variant={k.status === "active" ? "success" : "destructive"}>{k.status}</Badge>
              </div>
              <code className="block rounded bg-muted/50 px-2 py-1 text-xs">{k.maskedValue}</code>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>created {formatRelative(k.createdAt)}</span>
                <span>last used {formatRelative(k.lastUsedAt)}</span>
              </div>
              <KeyActions id={k.id} status={k.status} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
