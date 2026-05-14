"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, Plus, Play, Trash2, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { upsertWorkflow, deleteWorkflow, runWorkflowNow } from "./actions";

interface Step { id?: string; agentId: string; agentName?: string; prompt?: string | null }
interface WorkflowDTO {
  id: string;
  name: string;
  description: string | null;
  inputTask: string | null;
  steps: Step[];
}

export function A2AClient({ workflows, agents }: { workflows: WorkflowDTO[]; agents: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<WorkflowDTO | null>(workflows[0] ?? null);
  const [pending, start] = useTransition();
  const [trace, setTrace] = useState<{ stepId: string; agentName: string; output: string; ok: boolean; latencyMs: number }[] | null>(null);
  const [inputTask, setInputTask] = useState(active?.inputTask ?? "");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {workflows.length} workflow{workflows.length === 1 ? "" : "s"} in this workspace
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> New workflow
            </Button>
          </DialogTrigger>
          <WorkflowDialog
            agents={agents}
            onClose={() => setOpen(false)}
          />
        </Dialog>
      </div>

      {workflows.length === 0 ? (
        <EmptyState icon={Workflow} title="No A2A workflows yet" description="Chain multiple agents into a workflow." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            {workflows.map((w) => (
              <button
                key={w.id}
                onClick={() => { setActive(w); setInputTask(w.inputTask ?? ""); setTrace(null); }}
                className={`block w-full rounded-lg border p-3 text-left transition-colors ${
                  active?.id === w.id ? "border-primary bg-primary/5" : "hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold">{w.name}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{w.description ?? "—"}</p>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                  {w.steps.map((s, idx) => (
                    <span key={s.id ?? idx} className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-[10px]">{s.agentName}</Badge>
                      {idx < w.steps.length - 1 && <ArrowRight className="h-3 w-3" />}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {active && (
            <Card className="lg:col-span-2">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold">{active.name}</p>
                    <p className="text-xs text-muted-foreground">{active.description ?? "No description"}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        if (!confirm("Delete this workflow?")) return;
                        await deleteWorkflow(active.id);
                        toast.success("Workflow deleted");
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Pipeline</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {active.steps.map((s, idx) => (
                      <div key={s.id ?? idx} className="flex items-center gap-2">
                        <Badge>{s.agentName}</Badge>
                        {idx < active.steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Input task</Label>
                  <Textarea rows={3} value={inputTask} onChange={(e) => setInputTask(e.target.value)} />
                </div>

                <Button
                  className="w-full"
                  disabled={pending || !inputTask.trim()}
                  onClick={() =>
                    start(async () => {
                      try {
                        const res = await runWorkflowNow(active.id, inputTask);
                        setTrace(res.trace);
                        toast.success("Workflow complete");
                      } catch {
                        toast.error("Workflow failed");
                      }
                    })
                  }
                >
                  <Play className="mr-1 h-4 w-4" /> Run chain
                </Button>

                {trace && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Execution trace</p>
                    {trace.map((t, idx) => (
                      <div key={t.stepId + idx} className="rounded-lg border bg-card p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{idx + 1}. {t.agentName}</p>
                          <div className="flex gap-2 text-xs">
                            <Badge variant={t.ok ? "success" : "destructive"}>{t.ok ? "ok" : "error"}</Badge>
                            <Badge variant="secondary">{t.latencyMs}ms</Badge>
                          </div>
                        </div>
                        <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{t.output}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function WorkflowDialog({ agents, onClose }: { agents: { id: string; name: string }[]; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [name, setName] = useState("My A2A workflow");
  const [description, setDescription] = useState("");
  const [inputTask, setInputTask] = useState("");
  const [steps, setSteps] = useState<{ agentId: string; prompt?: string }[]>([
    { agentId: agents[0]?.id ?? "" },
  ]);

  function addStep() {
    setSteps((prev) => [...prev, { agentId: agents[0]?.id ?? "" }]);
  }
  function removeStep(idx: number) {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateStep(idx: number, patch: Partial<{ agentId: string; prompt: string }>) {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>New A2A workflow</DialogTitle>
      </DialogHeader>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!steps.length || steps.some((s) => !s.agentId)) {
            toast.error("Add at least one step with a selected agent");
            return;
          }
          start(async () => {
            try {
              await upsertWorkflow({ name, description, inputTask, steps });
              toast.success("Workflow created");
              onClose();
            } catch {
              toast.error("Could not create workflow");
            }
          });
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Default input task</Label>
          <Textarea rows={2} value={inputTask} onChange={(e) => setInputTask(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Steps</Label>
          {steps.map((s, idx) => (
            <div key={idx} className="grid grid-cols-12 items-center gap-2 rounded border p-2">
              <span className="col-span-1 text-center text-sm text-muted-foreground">{idx + 1}.</span>
              <div className="col-span-4">
                <Select value={s.agentId} onValueChange={(v) => updateStep(idx, { agentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Agent" /></SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-6">
                <Input
                  placeholder="Step prompt (optional)"
                  value={s.prompt ?? ""}
                  onChange={(e) => updateStep(idx, { prompt: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeStep(idx)}
                className="col-span-1"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addStep}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add step
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create workflow"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
