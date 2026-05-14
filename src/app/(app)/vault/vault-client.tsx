"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createApiKey, revokeApiKey, deleteApiKey } from "./actions";

export function CreateKeyButton() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [provider, setProvider] = useState("openai");
  const [name, setName] = useState("");
  const [value, setValue] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> New API key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add API key</DialogTitle>
          <DialogDescription>
            We&apos;ll mask the value in the UI and encrypt the full secret at rest.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              try {
                await createApiKey({ provider, name, value });
                toast.success("Key saved");
                setOpen(false);
                setName("");
                setValue("");
              } catch {
                toast.error("Could not save key");
              }
            });
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Provider</Label>
              <Input value={provider} onChange={(e) => setProvider(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Key name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Secret value</Label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              type="password"
              minLength={8}
              required
              placeholder="sk-•••"
            />
            <p className="text-[11px] text-muted-foreground">
              Stored encrypted; only the masked value is shown after saving.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save key"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function KeyActions({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      {status === "active" && (
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await revokeApiKey(id);
              toast.success("Key revoked");
            })
          }
        >
          Revoke
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        disabled={pending}
        onClick={() =>
          start(async () => {
            if (!confirm("Delete key permanently?")) return;
            await deleteApiKey(id);
            toast.success("Key deleted");
          })
        }
      >
        Delete
      </Button>
    </div>
  );
}
