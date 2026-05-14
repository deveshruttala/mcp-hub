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

interface SignupFormProps {
  googleEnabled: boolean;
  emailEnabled: boolean;
}

export function SignupForm({ googleEnabled, emailEnabled }: SignupFormProps) {
  const router = useRouter();
  const [pwLoading, setPwLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicEmail, setMagicEmail] = useState("");

  async function handlePasswordSignup(e: React.FormEvent) {
    e.preventDefault();
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not create account");
      }
      const sign = await signIn("credentials", { email, password, redirect: false });
      if (sign?.ok) {
        toast.success("Account created");
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error("Account created, please sign in");
        router.push("/login");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setPwLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!magicEmail) return;
    setEmailLoading(true);
    // Magic-link sign-up auto-creates a User row via the Prisma adapter, and
    // the `events.signIn` hook in src/auth.ts will assign a workspace.
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
        <CardTitle>Create your workspace</CardTitle>
        <CardDescription>Start orchestrating your AI agents in minutes</CardDescription>
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
              Sign up with Google
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
                  We&apos;ll email you a one-time link to create your account and sign in.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={emailLoading || !magicEmail}>
                {emailLoading ? "Sending…" : "Email me a sign-up link"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="password">
            <form onSubmit={handlePasswordSignup} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={pwLoading}>
                {pwLoading ? "Creating…" : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
