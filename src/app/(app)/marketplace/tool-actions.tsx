"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { installTool, uninstallTool } from "./actions";

export function ToolActions({ toolId, installed }: { toolId: string; installed: boolean }) {
  const [pending, start] = useTransition();

  return (
    <Button
      variant={installed ? "outline" : "default"}
      className="w-full"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            if (installed) {
              await uninstallTool(toolId);
              toast.success("Tool uninstalled");
            } else {
              await installTool(toolId);
              toast.success("Tool installed");
            }
          } catch {
            toast.error("Action failed");
          }
        })
      }
    >
      {pending ? "Working…" : installed ? "Uninstall" : "Install"}
    </Button>
  );
}
