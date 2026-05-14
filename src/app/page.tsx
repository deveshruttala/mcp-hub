import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Bot,
  Plug,
  Sparkles,
  Workflow,
  Shield,
  KeyRound,
  Clock,
  Store,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TOOL_COUNT } from "@/lib/data/tool-catalog";

const features = [
  {
    icon: Store,
    title: `MCP Marketplace · ${TOOL_COUNT}+ tools`,
    description: "One-click install pre-built MCP tools — Gmail, GitHub, Slack, Notion, Stripe, Postgres, OpenAI and 100+ more.",
  },
  {
    icon: Plug,
    title: "Connect once, use everywhere",
    description: "Authenticate Google, Slack, GitHub a single time. Every agent and AI app reuses it.",
  },
  {
    icon: Brain,
    title: "Universal memory",
    description: "Store preferences, project context, and company knowledge once — share across ChatGPT, Claude, Cursor.",
  },
  {
    icon: Bot,
    title: "Composable agents",
    description: "Build agents with allowed tools, scoped memory, permissions, and budgets.",
  },
  {
    icon: Clock,
    title: "Cron + event agents",
    description: "Schedule daily summaries, weekly reports, or trigger on webhooks.",
  },
  {
    icon: Workflow,
    title: "A2A workflows",
    description: "Chain agents: Research → Plan → Write → QA. Deterministic execution traces.",
  },
  {
    icon: Shield,
    title: "Permissions you control",
    description: "Granular permission slugs per agent and tool — denied calls are blocked, not silently ignored.",
  },
  {
    icon: KeyRound,
    title: "Encrypted API key vault",
    description: "Store provider keys once. Masked everywhere. Rotated centrally.",
  },
];

const useCases = [
  "Use the same memory across ChatGPT, Claude, and Cursor",
  "Connect Google, Slack, GitHub once — every agent inherits it",
  "Schedule cron agents for daily standups and reports",
  "Build A2A agent workflows for research and writing",
  "Manage permissions and API keys from one dashboard",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold">AgentHub</span>
        </Link>
        <nav className="hidden gap-6 text-sm md:flex">
          <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground">How it works</a>
          <a href="#use-cases" className="text-muted-foreground hover:text-foreground">Use cases</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="gradient-bg relative">
        <div className="container py-24 text-center md:py-32">
          <Badge variant="outline" className="mb-6">
            <Sparkles className="mr-1 h-3 w-3" /> Universal MCP + AI agent OS · {TOOL_COUNT}+ tools
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            One login, one memory, one tool hub for{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              every AI agent
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Stop re-configuring tools, keys, and memory across ChatGPT, Claude, Cursor, Gemini and every other AI app.
            AgentHub is the central operating system that any agent can plug into.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 md:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Try the demo workspace</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Demo login: <code className="rounded bg-muted px-1">demo@agenthub.dev</code> ·{" "}
            <code className="rounded bg-muted px-1">demo1234</code>
          </p>
        </div>
      </section>

      <section id="problem" className="border-y bg-muted/30">
        <div className="container grid gap-10 py-20 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">The problem</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              AI is everywhere — but configuration is fragmented.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every AI app — ChatGPT, Claude, Cursor, VSCode, Gemini — wants its own logins, MCP tools, API keys,
              and memory. Switching apps means re-doing all of it. Teams cannot enforce permissions consistently.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">The solution</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              AgentHub: the central hub for AI agents.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Connect tools once. Store memory once. Manage permissions and API keys centrally. Any agent — local
              or hosted, in ChatGPT or Cursor or your own app — talks to AgentHub through a hosted MCP/API gateway.
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Everything your agents need</h2>
          <p className="mt-3 text-muted-foreground">
            A complete operating system: registry, memory, permissions, scheduling, and execution logs.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="border-muted">
              <CardContent className="p-5">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y bg-muted/30">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">How it works</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { n: "1", t: "Connect", d: "Authenticate Google, GitHub, Slack, Notion, Stripe in seconds." },
              { n: "2", t: "Configure", d: "Install MCP tools, write memory, define agents and permissions." },
              { n: "3", t: "Run anywhere", d: "Any AI app or custom agent calls AgentHub through MCP or REST." },
            ].map((s) => (
              <Card key={s.n}>
                <CardContent className="p-6">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {s.n}
                  </div>
                  <h3 className="text-lg font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="use-cases" className="container py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Built for the multi-agent era</h2>
            <p className="mt-3 text-muted-foreground">
              From a solo founder running their inbox to a team coordinating dozens of AI agents — AgentHub scales.
            </p>
          </div>
          <ul className="space-y-3">
            {useCases.map((u) => (
              <li key={u} className="flex items-start gap-3 rounded-lg border bg-card p-4">
                <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                <span className="text-sm">{u}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Stop reconfiguring. Start orchestrating.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Sign up and you&apos;ll get a fully-loaded demo workspace with seeded tools, memory, agents, and a
          scheduled cron — explore in 30 seconds.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">
              Start free <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Try the demo workspace</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-3 py-8 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} AgentHub · One hub for every AI agent</p>
          <div className="flex gap-4">
            <Link href="/login">Sign in</Link>
            <Link href="/signup">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
