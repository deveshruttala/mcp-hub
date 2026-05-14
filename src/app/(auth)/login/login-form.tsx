"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleIcon } from "@/components/ui/google-icon";

interface LoginFormProps {
  googleEnabled: boolean;
  emailEnabled: boolean;
}

export function LoginForm({ googleEnabled, emailEnabled }: LoginFormProps) {
  const router = useRouter();
  const [credsLoading, setCredsLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [credsEmail, setCredsEmail] = useState("demo@agenthub.dev");
  const [credsPassword, setCredsPassword] = useState("demo1234");
  const [magicEmail, setMagicEmail] = useState("");

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setCredsLoading(true);
    const res = await signIn("credentials", {
      email: credsEmail,
      password: credsPassword,
      redirect: false,
    });
    setCredsLoading(false);
    if (res?.ok) {
      toast.success("Signed in");
      router.push("/dashboard");
      router.refresh();
    } else {
      toast.error("Invalid credentials");
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!magicEmail) return;
    setEmailLoading(true);
    const res = await signIn("nodemailer", {
      email: magicEmail,
      callbackUrl: "/dashboard",
      redirect: false,
    });
    setEmailLoading(false);
    if (res?.error) {
      toast.error("Could not send magic link");
    } else {
      toast.success("Magic link sent");
      router.push("/verify-request");
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your AgentHub workspace</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {googleEnabled && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              <GoogleIcon className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                or
              </span>
            </div>
          </>
        )}

        <Tabs defaultValue={emailEnabled ? "magic" : "password"}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="magic" disabled={!emailEnabled}>
              <Mail className="mr-1 h-3.5 w-3.5" /> Magic link
            </TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>

          <TabsContent value="magic">
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="magic-email">Email</Label>
                <Input
                  id="magic-email"
                  type="email"
                  required
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  placeholder="you@company.com"
                />
                <p className="text-[11px] text-muted-foreground">
                  We&apos;ll email you a one-time link to sign in. No password required.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={emailLoading || !magicEmail}>
                {emailLoading ? "Sending…" : "Email me a sign-in link"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="password">
            <form onSubmit={handleCredentials} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={credsEmail}
                  onChange={(e) => setCredsEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={credsPassword}
                  onChange={(e) => setCredsPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full" disabled={credsLoading}>
                {credsLoading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-foreground underline">
            Create one
          </Link>
        </p>
        <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Demo credentials</p>
          <p>demo@agenthub.dev · demo1234</p>
        </div>
      </CardContent>
    </Card>
  );
}
