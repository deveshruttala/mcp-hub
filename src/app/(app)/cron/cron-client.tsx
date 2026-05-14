"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Clock, Plus, Play, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative } from "@/lib/utils";
import { upsertCron, toggleCron, deleteCron, runCronNow } from "./actions";

interface Job {
  id: string;
  name: string;
  schedule: string;
  timezone: string;
  prompt: string;
  enabled: boolean;
  retryPolicy: string;
  agentId: string;
  agentName: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

export function CronClient({ jobs, agents }: { jobs: Job[]; agents: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> New cron
            </Button>
          </DialogTrigger>
          <CronDialog editing={editing} agents={agents} onClose={() => { setOpen(false); setEditing(null); }} />
        </Dialog>
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon={Clock} title="No cron agents yet" description="Schedule recurring agent runs with cron expressions." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {jobs.map((j) => (
            <Card key={j.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{j.name}</p>
                    <p className="text-xs text-muted-foreground">{j.agentName}</p>
                  </div>
                  <Switch
                    checked={j.enabled}
                    onCheckedChange={(v) =>
                      start(async () => {
                        await toggleCron(j.id, v);
                        toast.success(v ? "Enabled" : "Paused");
                      })
                    }
                  />
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{j.prompt}</p>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <Badge variant="secondary">{j.schedule}</Badge>
                  <Badge variant="secondary">{j.timezone}</Badge>
                  <Badge variant="outline">retry: {j.retryPolicy}</Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>last: {formatRelative(j.lastRunAt)}</span>
                  <span>next: {formatRelative(j.nextRunAt)}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        try {
                          const res = await runCronNow(j.id);
                          if (res.ok) toast.success("Run complete");
                          else toast.error(res.error ?? "Run failed");
                        } catch {
                          toast.error("Run failed");
                        }
                      })
                    }
                  >
                    <Play className="mr-1 h-3.5 w-3.5" /> Run now
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => { setEditing(j); setOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        if (!confirm("Delete this cron?")) return;
                        await deleteCron(j.id);
                        toast.success("Deleted");
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CronDialog({
  editing,
  agents,
  onClose,
}: {
  editing: Job | null;
  agents: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [name, setName] = useState(editing?.name ?? "");
  const [agentId, setAgentId] = useState(editing?.agentId ?? agents[0]?.id ?? "");
  const [schedule, setSchedule] = useState(editing?.schedule ?? "0 9 * * *");
  const [timezone, setTimezone] = useState(editing?.timezone ?? "America/Los_Angeles");
  const [prompt, setPrompt] = useState(editing?.prompt ?? "Summarize today's priorities.");
  const [enabled, setEnabled] = useState(editing?.enabled ?? true);
  const [retryPolicy, setRetryPolicy] = useState(editing?.retryPolicy ?? "retry-3");

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit cron" : "New cron"}</DialogTitle>
      </DialogHeader>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            try {
              await upsertCron({
                id: editing?.id,
                name,
                agentId,
                schedule,
                timezone,
                prompt,
                enabled,
                retryPolicy: retryPolicy as never,
              });
              toast.success("Cron saved");
              onClose();
            } catch {
              toast.error("Could not save");
            }
          });
        }}
      >
        <div className="space-y-1">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Agent</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Retry</Label>
            <Select value={retryPolicy} onValueChange={setRetryPolicy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="retry-3">Retry 3x</SelectItem>
                <SelectItem value="exponential">Exponential</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Cron</Label>
            <Input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="0 9 * * *" />
          </div>
          <div className="space-y-1">
            <Label>Timezone</Label>
            <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Prompt</Label>
          <Textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} required />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={enabled} onCheckedChange={setEnabled} /> Enabled
        </label>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save cron"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
