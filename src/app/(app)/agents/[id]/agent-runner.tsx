"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { testRunAgent } from "../actions";

export function AgentRunner({ agentId }: { agentId: string }) {
  const [input, setInput] = useState("Summarize what's most important for me to focus on today.");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Awaited<ReturnType<typeof testRunAgent>> | null>(null);

  return (
    <div className="space-y-3">
      <Textarea
        rows={3}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a task for the agent…"
      />
      <div className="flex justify-end">
        <Button
          disabled={pending || !input.trim()}
          onClick={() =>
            start(async () => {
              try {
                const res = await testRunAgent(agentId, input);
                setResult(res);
                if (res.ok) toast.success(`Run complete in ${res.latencyMs}ms`);
                else toast.error(res.error ?? "Run failed");
              } catch (err) {
                toast.error("Run failed");
                console.error(err);
              }
            })
          }
        >
          {pending ? "Running…" : "Run agent"}
        </Button>
      </div>

      {result && (
        <div className="space-y-2 rounded-md border bg-muted/20 p-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant={result.ok ? "success" : "destructive"}>{result.ok ? "success" : "error"}</Badge>
            <Badge variant="secondary">{result.latencyMs}ms</Badge>
            <Badge variant="secondary">${result.estimatedCost.toFixed(4)}</Badge>
            <Badge variant="info">{result.toolsUsed.length} tools</Badge>
            <Badge variant="info">{result.memoryUsed.length} memory</Badge>
          </div>
          <pre className="whitespace-pre-wrap text-xs text-foreground/90">
            {result.output ?? result.error}
          </pre>
        </div>
      )}
    </div>
  );
}
