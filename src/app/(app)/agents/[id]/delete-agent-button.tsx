"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAgent } from "../actions";

export function DeleteAgentButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="destructive"
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (!confirm("Delete this agent? This cannot be undone.")) return;
          try {
            await deleteAgent(id);
            toast.success("Agent deleted");
          } catch {
            toast.error("Could not delete");
          }
        })
      }
    >
      <Trash2 className="mr-1 h-4 w-4" /> Delete
    </Button>
  );
}
