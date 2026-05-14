"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { connectProvider, disconnectProvider } from "./actions";

export function ConnectionActions({ provider, connected }: { provider: string; connected: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      {connected ? (
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={pending}
          onClick={() =>
            start(async () => {
              try {
                await disconnectProvider(provider);
                toast.success(`${provider} disconnected`);
              } catch {
                toast.error("Could not disconnect");
              }
            })
          }
        >
          {pending ? "Working…" : "Disconnect"}
        </Button>
      ) : (
        <Button
          size="sm"
          className="flex-1"
          disabled={pending}
          onClick={() =>
            start(async () => {
              try {
                await connectProvider(provider);
                toast.success(`${provider} connected (mocked)`);
              } catch {
                toast.error("Could not connect");
              }
            })
          }
        >
          {pending ? "Connecting…" : "Connect"}
        </Button>
      )}
    </div>
  );
}
