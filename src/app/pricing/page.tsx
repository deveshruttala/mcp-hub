import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const tiers = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "For solo builders trying out AgentHub.",
    features: ["3 agents", "5 installed tools", "50 memory items", "Manual runs only", "Community support"],
  },
  {
    name: "Pro",
    price: "$29",
    cadence: "per month",
    highlighted: true,
    description: "For founders running real agent workflows.",
    features: [
      "Unlimited agents",
      "Cron + event agents",
      "Unlimited memory",
      "Execution logs",
      "A2A workflows",
      "Email support",
    ],
  },
  {
    name: "Team",
    price: "$99",
    cadence: "per month",
    description: "For teams that share memory + permissions.",
    features: ["Shared memory", "Team permissions", "Audit logs", "Workspace SSO", "Priority support"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "contact us",
    description: "For organizations with strict compliance.",
    features: ["Private cloud", "SOC2-ready controls", "Custom integrations", "Dedicated support", "SLA"],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-semibold">AgentHub</span>
        </Link>
        <Button asChild>
          <Link href="/signup">Get started</Link>
        </Button>
      </header>
      <section className="container py-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Simple pricing for every stage</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Start free, scale as your agents drive measurable ROI.
        </p>
      </section>
      <section className="container pb-20">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t) => (
            <Card
              key={t.name}
              className={t.highlighted ? "border-primary shadow-lg ring-1 ring-primary/40" : ""}
            >
              <CardContent className="p-6">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="mt-2 text-3xl font-semibold">{t.price}</p>
                <p className="text-xs text-muted-foreground">{t.cadence}</p>
                <p className="mt-3 text-sm text-muted-foreground">{t.description}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant={t.highlighted ? "default" : "outline"} asChild>
                  <Link href="/signup">Choose {t.name}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/" className="text-sm text-muted-foreground underline">
            ← Back to home
          </Link>
        </div>
      </section>
    </div>
  );
}
