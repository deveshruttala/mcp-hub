"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { upsertAgent } from "./actions";

interface ToolOpt { slug: string; name: string }
interface PermOpt { slug: string; label: string }

export function AgentForm({
  agent,
  tools,
  permissions,
}: {
  agent?: {
    id: string;
    name: string;
    description: string;
    systemInstructions: string;
    model: string;
    allowedTools: string[];
    permissions: string[];
    memoryAccess: string;
    budgetLimit: number;
    executionMode: string;
    status: string;
  };
  tools: ToolOpt[];
  permissions: PermOpt[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState(agent?.name ?? "");
  const [description, setDescription] = useState(agent?.description ?? "");
  const [systemInstructions, setSystemInstructions] = useState(agent?.systemInstructions ?? "");
  const [model, setModel] = useState(agent?.model ?? "gpt-4o-mini");
  const [allowedTools, setAllowedTools] = useState<string[]>(agent?.allowedTools ?? []);
  const [grantedPermissions, setGrantedPermissions] = useState<string[]>(agent?.permissions ?? ["use_memory"]);
  const [memoryAccess, setMemoryAccess] = useState(agent?.memoryAccess ?? "all");
  const [budgetLimit, setBudgetLimit] = useState(agent?.budgetLimit ?? 10);
  const [executionMode, setExecutionMode] = useState(agent?.executionMode ?? "manual");
  const [status, setStatus] = useState(agent?.status ?? "active");

  function toggle(arr: string[], value: string, setter: (v: string[]) => void) {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  }

  return (
    <form
      className="grid gap-4 lg:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          try {
            const res = await upsertAgent({
              id: agent?.id,
              name,
              description,
              systemInstructions,
              model,
              allowedTools,
              permissions: grantedPermissions,
              memoryAccess: memoryAccess as never,
              budgetLimit: Number(budgetLimit),
              executionMode: executionMode as never,
              status: status as never,
            });
            toast.success("Agent saved");
            router.push(`/agents/${res.id}`);
            router.refresh();
          } catch {
            toast.error("Could not save agent");
          }
        });
      }}
    >
      <Card className="lg:col-span-2">
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                  <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                  <SelectItem value="claude-3-5-sonnet">claude-3-5-sonnet</SelectItem>
                  <SelectItem value="gemini-1.5-pro">gemini-1.5-pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>System instructions</Label>
            <Textarea
              rows={6}
              value={systemInstructions}
              onChange={(e) => setSystemInstructions(e.target.value)}
              required
            />
          </div>
          <div>
            <p className="text-sm font-medium">Allowed tools</p>
            <p className="text-xs text-muted-foreground">Pick which installed MCP tools this agent may call.</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {tools.map((t) => {
                const checked = allowedTools.includes(t.slug);
                return (
                  <label key={t.slug} className="flex items-center gap-2 rounded border p-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(allowedTools, t.slug, setAllowedTools)}
                    />
                    <span>{t.name}</span>
                  </label>
                );
              })}
              {tools.length === 0 && (
                <p className="text-xs text-muted-foreground">Install tools from the marketplace first.</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Permissions</p>
            <p className="text-xs text-muted-foreground">Tools require permissions. Missing permissions deny execution.</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {permissions.map((p) => {
                const on = grantedPermissions.includes(p.slug);
                return (
                  <button
                    type="button"
                    key={p.slug}
                    onClick={() => toggle(grantedPermissions, p.slug, setGrantedPermissions)}
                    className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                      on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1">
            <Label>Execution mode</Label>
            <Select value={executionMode} onValueChange={setExecutionMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="cron">Cron / scheduled</SelectItem>
                <SelectItem value="event">Event-triggered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Memory access</Label>
            <Select value={memoryAccess} onValueChange={setMemoryAccess}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All workspace memory</SelectItem>
                <SelectItem value="linked">Linked to this agent only</SelectItem>
                <SelectItem value="none">No memory</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Monthly budget ($)</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(Number(e.target.value))}
            />
          </div>
          <Badge variant="info">
            {allowedTools.length} tool{allowedTools.length === 1 ? "" : "s"} · {grantedPermissions.length} permission
            {grantedPermissions.length === 1 ? "" : "s"}
          </Badge>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : agent ? "Update agent" : "Create agent"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
