/**
 * /verify-request
 *
 * Shown after a user requests an email magic link. In production the link is
 * delivered via SMTP. In development, look at the dev-server console — the
 * full URL is printed there.
 */

import Link from "next/link";
import { Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VerifyRequestPage() {
  const isDev = process.env.NODE_ENV !== "production";
  const hasSmtp = Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We just sent a sign-in link to your inbox. Open the email and click the link to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          The link is valid for 24 hours. You can close this tab safely.
        </p>
        {isDev && !hasSmtp && (
          <div className="rounded-md border bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
            <p className="font-medium">Dev mode</p>
            <p className="mt-1">
              SMTP is not configured, so the magic link was printed to your dev-server console. Paste it into
              your browser to sign in. Configure <code className="rounded bg-muted px-1">EMAIL_SERVER</code> and{" "}
              <code className="rounded bg-muted px-1">EMAIL_FROM</code> in <code className="rounded bg-muted px-1">.env</code> to
              send real emails.
            </p>
          </div>
        )}
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login">Back to sign in</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
