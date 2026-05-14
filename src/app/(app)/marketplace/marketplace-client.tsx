"use client";

import { useMemo, useState } from "react";
import { Search, Star, Store } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToolActions } from "./tool-actions";
import { cn } from "@/lib/utils";

interface ToolDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  endpoint: string;
  rating: number;
  status: string;
  permissions: string[];
}

/**
 * Client-side marketplace browser with debounced search and category filter.
 * Renders the full 100+ tool catalog with virtualization-friendly grid (the
 * grid is small enough to render flat without `react-window` for the MVP).
 */
export function MarketplaceClient({
  tools,
  installedIds,
}: {
  tools: ToolDTO[];
  installedIds: string[];
}) {
  const installed = useMemo(() => new Set(installedIds), [installedIds]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [showInstalledOnly, setShowInstalledOnly] = useState(false);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tools) counts[t.category] = (counts[t.category] ?? 0) + 1;
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [tools]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((t) => {
      if (activeCategory !== "all" && t.category !== activeCategory) return false;
      if (showInstalledOnly && !installed.has(t.id)) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.permissions.some((p) => p.includes(q))
      );
    });
  }, [tools, query, activeCategory, showInstalledOnly, installed]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 100+ MCP tools by name, capability, or permission…"
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryPill
              label={`All · ${tools.length}`}
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            />
            {categories.map((c) => (
              <CategoryPill
                key={c.name}
                label={`${c.name} · ${c.count}`}
                active={activeCategory === c.name}
                onClick={() => setActiveCategory(c.name)}
              />
            ))}
            <button
              type="button"
              onClick={() => setShowInstalledOnly((v) => !v)}
              className={cn(
                "ml-auto rounded-md border px-2 py-1 text-xs transition-colors",
                showInstalledOnly
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-accent",
              )}
            >
              {showInstalledOnly ? "Showing installed" : "Show installed only"}
            </button>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No tools match your filters. Try clearing the search or category.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((tool) => {
            const isInstalled = installed.has(tool.id);
            return (
              <Card key={tool.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Store className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-sm">{tool.name}</CardTitle>
                        <CardDescription className="text-[11px]">{tool.category}</CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={tool.status === "stable" ? "success" : tool.status === "beta" ? "warning" : "info"}
                      className="text-[10px]"
                    >
                      {tool.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 pt-0 text-sm">
                  <p className="line-clamp-2 text-xs text-muted-foreground">{tool.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {tool.permissions.slice(0, 3).map((p) => (
                      <Badge key={p} variant="outline" className="text-[10px]">
                        {p}
                      </Badge>
                    ))}
                    {tool.permissions.length > 3 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{tool.permissions.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {tool.rating.toFixed(1)}
                    </span>
                    <code className="truncate text-[10px]">{tool.slug}</code>
                  </div>
                  <div className="mt-auto pt-1">
                    <ToolActions toolId={tool.id} installed={isInstalled} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}
