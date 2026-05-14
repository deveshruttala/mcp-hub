"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Plug,
  Brain,
  Bot,
  Clock,
  Workflow,
  Shield,
  KeyRound,
  ScrollText,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/marketplace", label: "MCP Marketplace", icon: Store },
      { href: "/connections", label: "Connections", icon: Plug },
    ],
  },
  {
    label: "Build",
    items: [
      { href: "/agents", label: "Agents", icon: Bot },
      { href: "/memory", label: "Memory", icon: Brain },
      { href: "/cron", label: "Cron Agents", icon: Clock },
      { href: "/a2a", label: "A2A Workflows", icon: Workflow },
    ],
  },
  {
    label: "Operate",
    items: [
      { href: "/logs", label: "Execution Logs", icon: ScrollText },
      { href: "/permissions", label: "Permissions", icon: Shield },
      { href: "/vault", label: "API Key Vault", icon: KeyRound },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-card/40">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">AgentHub</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Agent OS</p>
        </div>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Free plan</p>
        <p>3 agents · 5 tools · 50 memories</p>
      </div>
    </aside>
  );
}
