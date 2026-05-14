"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { upsertMemory, deleteMemory, searchWorkspaceMemory } from "./actions";

interface MemoryItem {
  id: string;
  title: string;
  content: string;
  type: string;
  visibility: string;
  agentId: string | null;
  agentName: string | null;
  updatedAt: string;
}

const TYPES = [
  { value: "user_preference", label: "User preference" },
  { value: "project_context", label: "Project context" },
  { value: "company_knowledge", label: "Company knowledge" },
  { value: "agent_instruction", label: "Agent instruction" },
  { value: "tool_usage", label: "Tool usage" },
  { value: "long_term_note", label: "Long-term note" },
];

export function MemoryClient({
  initialItems,
  agents,
}: {
  initialItems: MemoryItem[];
  agents: { id: string; name: string }[];
}) {
  const [items] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MemoryItem | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; content: string; score: number }[] | null>(
    null,
  );
  const [previewIds, setPreviewIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.content.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q),
    );
  }, [items, query]);

  const previewItems = items.filter((i) => previewIds.has(i.id));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search memory…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant="outline"
            disabled={pending || !query.trim()}
            onClick={() =>
              start(async () => {
                const results = await searchWorkspaceMemory(query);
                setSearchResults(results);
                toast.success(`Found ${results.length} semantic match${results.length === 1 ? "" : "es"}`);
              })
            }
          >
            Semantic search
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> Add memory
              </Button>
            </DialogTrigger>
            <MemoryDialog editing={editing} agents={agents} onClose={() => { setOpen(false); setEditing(null); }} />
          </Dialog>
        </div>

        {searchResults && (
          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Semantic results for &quot;{query}&quot;
                </p>
                <button className="text-xs text-muted-foreground underline" onClick={() => setSearchResults(null)}>
                  clear
                </button>
              </div>
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">No semantic matches yet — try a different query.</p>
              ) : (
                searchResults.map((r) => (
                  <div key={r.id} className="rounded border bg-muted/20 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{r.title}</p>
                      <Badge variant="info">score {r.score}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-muted-foreground">{r.content}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={Brain}
            title="No memory yet"
            description="Add a memory and reuse it across every agent and AI app."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.agentName ?? "Workspace"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-[10px]">{item.type.replaceAll("_", " ")}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{item.visibility}</Badge>
                    </div>
                  </div>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{item.content}</p>
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={previewIds.has(item.id)}
                        onChange={(e) => {
                          setPreviewIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(item.id);
                            else next.delete(item.id);
                            return next;
                          });
                        }}
                      />
                      preview
                    </label>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditing(item); setOpen(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={pending}
                        onClick={() =>
                          start(async () => {
                            await deleteMemory(item.id);
                            toast.success("Memory deleted");
                          })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="lg:sticky lg:top-20 h-fit">
        <CardContent className="space-y-3 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Inject into agent context</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tick &quot;preview&quot; on a memory item to see how it would be passed to an agent at run time.
            </p>
          </div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-xs">
{previewItems.length === 0
  ? "// Select memory items to preview the agent context injection.\n// Format: shared workspace memory + agent-specific memory."
  : `# Workspace memory injected\n\n${previewItems
      .map((p, idx) => `[${idx + 1}] ${p.title} (${p.type})\n${p.content}`)
      .join("\n\n")}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function MemoryDialog({
  editing,
  agents,
  onClose,
}: {
  editing: MemoryItem | null;
  agents: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [title, setTitle] = useState(editing?.title ?? "");
  const [content, setContent] = useState(editing?.content ?? "");
  const [type, setType] = useState(editing?.type ?? "company_knowledge");
  const [visibility, setVisibility] = useState(editing?.visibility ?? "private");
  const [agentId, setAgentId] = useState(editing?.agentId ?? "");

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit memory" : "New memory"}</DialogTitle>
        <DialogDescription>Memory is reusable across agents — keep titles short and content actionable.</DialogDescription>
      </DialogHeader>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            try {
              await upsertMemory({
                id: editing?.id,
                title,
                content,
                type: type as never,
                visibility: visibility as never,
                agentId: agentId || null,
              });
              toast.success("Memory saved");
              onClose();
            } catch {
              toast.error("Could not save");
            }
          });
        }}
      >
        <div className="space-y-1">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Content</Label>
          <Textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="agent">Agent-specific</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {visibility === "agent" && (
          <div className="space-y-1">
            <Label>Linked agent</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger><SelectValue placeholder="Choose agent" /></SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
