import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="gradient-bg min-h-screen">
      <div className="container flex min-h-screen flex-col items-center justify-center py-10">
        <Link href="/" className="mb-8 flex items-center gap-2 text-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">AgentHub</span>
        </Link>
        {children}
        <p className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} AgentHub · One hub for every AI agent
        </p>
      </div>
    </div>
  );
}
