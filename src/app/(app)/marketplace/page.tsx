/**
 * MCP Marketplace
 * ----------------------------------------------------------------------------
 * Server component that loads the full tool catalog plus the workspace's
 * installed-tool set, then hands the data to a client filter component.
 *
 * Workspace isolation: tools are global (catalog), but installs are scoped to
 * the requesting user's workspace, derived from `requireWorkspace()`.
 */

import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { MarketplaceClient } from "./marketplace-client";
import { safeJsonParse } from "@/lib/utils";

export default async function MarketplacePage() {
  const { workspace } = await requireWorkspace();
  const [tools, installed] = await Promise.all([
    prisma.tool.findMany({ orderBy: [{ rating: "desc" }, { name: "asc" }] }),
    prisma.installedTool.findMany({ where: { workspaceId: workspace.id } }),
  ]);

  const installedSet = new Set(installed.map((i) => i.toolId));

  return (
    <div className="space-y-6">
      <PageHeader
        title="MCP Marketplace"
        description="Install MCP tools once. Every agent in this workspace can call them through the hosted gateway."
        action={
          <Badge variant="info" className="text-xs">
            {tools.length} tools available · {installed.length} installed
          </Badge>
        }
      />
      <MarketplaceClient
        tools={tools.map((t) => ({
          id: t.id,
          slug: t.slug,
          name: t.name,
          description: t.description,
          category: t.category,
          endpoint: t.endpoint,
          rating: t.rating,
          status: t.status,
          permissions: safeJsonParse<string[]>(t.permissions, []),
        }))}
        installedIds={Array.from(installedSet)}
      />
    </div>
  );
}
