import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TOOL_CATALOG } from "../src/lib/data/tool-catalog";

const prisma = new PrismaClient();

// Reuse the curated 100+ MCP catalog as the seed source of truth.
const TOOLS = TOOL_CATALOG;

const PERMISSIONS = [
  { slug: "read_email", label: "Read email", description: "Read messages from connected email providers" },
  { slug: "send_email", label: "Send email", description: "Send messages on behalf of the user" },
  { slug: "read_calendar", label: "Read calendar", description: "Read calendar events" },
  { slug: "write_calendar", label: "Write calendar", description: "Create or modify calendar events" },
  { slug: "read_files", label: "Read files", description: "Read user files and documents" },
  { slug: "write_files", label: "Write files", description: "Create or modify user files" },
  { slug: "read_code", label: "Read code", description: "Read repository contents" },
  { slug: "write_code", label: "Write code", description: "Create commits and pull requests" },
  { slug: "access_payments", label: "Access payments", description: "Read or trigger payment data" },
  { slug: "external_web", label: "External web", description: "Make outbound web requests" },
  { slug: "run_code", label: "Run code", description: "Execute sandboxed code" },
  { slug: "use_memory", label: "Use memory", description: "Read and write workspace memory" },
  { slug: "call_other_agents", label: "Call other agents", description: "Invoke agents in A2A workflows" },
];

const AGENTS = [
  {
    name: "Personal Research Agent",
    description: "Deep research synthesis with web + memory.",
    systemInstructions:
      "You are a research analyst. Synthesize sources, cite evidence, and produce concise briefs.",
    model: "gpt-4o-mini",
    allowedTools: ["web-research", "file-analyzer", "notion-knowledge-base"],
    permissions: ["external_web", "read_files", "write_files", "use_memory"],
    executionMode: "manual",
  },
  {
    name: "Email Summary Agent",
    description: "Summarizes daily inbox and surfaces priority threads.",
    systemInstructions: "You are an executive assistant. Summarize email and surface priority items.",
    model: "gpt-4o-mini",
    allowedTools: ["gmail-reader", "slack-summarizer"],
    permissions: ["read_email", "read_files", "use_memory"],
    executionMode: "cron",
  },
  {
    name: "GitHub Triage Agent",
    description: "Auto-labels and triages new GitHub issues.",
    systemInstructions: "You are an engineering manager. Triage issues with clear severity and labels.",
    model: "gpt-4o-mini",
    allowedTools: ["github-issue-agent", "github-pr-reviewer"],
    permissions: ["read_code", "write_code", "use_memory"],
    executionMode: "event",
  },
  {
    name: "Calendar Planning Agent",
    description: "Plans the week, resolves conflicts, drafts focus blocks.",
    systemInstructions: "You are a planning expert. Optimize calendars, protect focus time.",
    model: "gpt-4o-mini",
    allowedTools: ["google-calendar", "gmail-reader"],
    permissions: ["read_calendar", "write_calendar", "read_email", "use_memory"],
    executionMode: "cron",
  },
  {
    name: "Revenue Insights Agent",
    description: "Reports MRR, churn, and finance trends.",
    systemInstructions: "You are a finance analyst. Produce clear revenue insights with caveats.",
    model: "gpt-4o-mini",
    allowedTools: ["stripe-revenue", "notion-knowledge-base"],
    permissions: ["access_payments", "read_files", "write_files", "use_memory"],
    executionMode: "cron",
  },
];

const MEMORY = [
  {
    title: "Brand voice",
    content: "Tone is confident, friendly, and minimal. Avoid hype words. Prefer clarity over cleverness.",
    type: "company_knowledge",
    visibility: "team",
  },
  {
    title: "Working hours",
    content: "Focus blocks 9-12 daily. Meetings only between 13-17 PT.",
    type: "user_preference",
    visibility: "private",
  },
  {
    title: "Q3 launch goals",
    content: "Ship A2A workflows, integrate Cursor + Claude, hit $50k MRR by end of quarter.",
    type: "project_context",
    visibility: "team",
  },
  {
    title: "Email triage rules",
    content: "Tag investor emails P0. Cluster newsletters under 'Reading'. Auto-archive bounce notices.",
    type: "agent_instruction",
    visibility: "agent",
  },
  {
    title: "Stripe MRR formula",
    content: "MRR excludes one-time payments. Annual plans divided by 12.",
    type: "tool_usage",
    visibility: "team",
  },
  {
    title: "Investor list",
    content: "Acme Ventures, Northstar Capital, Lighthouse — quarterly updates due Mondays.",
    type: "long_term_note",
    visibility: "private",
  },
];

const CONNECTIONS = [
  { provider: "google", accountName: "demo@agenthub.dev", scopes: ["gmail.read", "calendar.read", "calendar.write"] },
  { provider: "github", accountName: "agenthub-dev", scopes: ["repo", "issues:write"] },
  { provider: "slack", accountName: "AgentHub Workspace", scopes: ["channels:read", "chat:write"] },
  { provider: "notion", accountName: "AgentHub Notion", scopes: ["read", "write"] },
  { provider: "stripe", accountName: "AgentHub Stripe", scopes: ["read"] },
];

const CRON_JOBS = [
  {
    name: "Daily email summary at 9 AM",
    schedule: "0 9 * * *",
    timezone: "America/Los_Angeles",
    prompt: "Summarize unread email and highlight priority threads.",
    agentName: "Email Summary Agent",
  },
  {
    name: "Weekly GitHub issue report",
    schedule: "0 10 * * 1",
    timezone: "America/Los_Angeles",
    prompt: "Generate a weekly report of open critical issues and PR status.",
    agentName: "GitHub Triage Agent",
  },
  {
    name: "Daily competitor research",
    schedule: "0 8 * * *",
    timezone: "America/Los_Angeles",
    prompt: "Research what competitors shipped today and produce a 5-bullet brief.",
    agentName: "Personal Research Agent",
  },
  {
    name: "Monthly Stripe revenue summary",
    schedule: "0 7 1 * *",
    timezone: "America/Los_Angeles",
    prompt: "Pull last month's MRR, churn, and top plans. Produce a stakeholder report.",
    agentName: "Revenue Insights Agent",
  },
];

function tokenize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

function buildEmbedding(text: string) {
  const tokens = tokenize(text);
  const map: Record<string, number> = {};
  for (const t of tokens) {
    if (t.length < 3) continue;
    map[t] = (map[t] ?? 0) + 1;
  }
  return JSON.stringify(map);
}

function nextRunFromCron(): Date {
  const next = new Date();
  next.setHours(next.getHours() + 6);
  return next;
}

async function main() {
  console.log("→ Seeding permissions");
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({ where: { slug: p.slug }, update: p, create: p });
  }

  console.log("→ Seeding tools");
  for (const t of TOOLS) {
    await prisma.tool.upsert({
      where: { slug: t.slug },
      update: { ...t, permissions: JSON.stringify(t.permissions) },
      create: { ...t, permissions: JSON.stringify(t.permissions) },
    });
  }

  console.log("→ Seeding demo user");
  const email = (process.env.SEED_USER_EMAIL ?? "demo@agenthub.dev").toLowerCase();
  const password = process.env.SEED_USER_PASSWORD ?? "demo1234";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      name: "Demo Founder",
      email,
      passwordHash,
    },
  });

  console.log("→ Seeding workspace");
  let workspace = await prisma.workspace.findFirst({
    where: { members: { some: { userId: user.id } } },
  });
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: "AgentHub Demo Workspace",
        slug: `demo-${user.id.slice(0, 6)}`,
        plan: "pro",
        members: { create: { userId: user.id, role: "owner" } },
      },
    });
  }

  // Auto-install a curated subset so the demo workspace boots with a useful
  // starter pack — the remaining ~120 tools are available in the marketplace.
  console.log("→ Installing starter tools");
  const STARTER_SLUGS = [
    "gmail-reader",
    "google-calendar",
    "slack-summarizer",
    "github-issue-agent",
    "github-pr-reviewer",
    "notion-knowledge-base",
    "web-research",
    "file-analyzer",
    "stripe-revenue",
    "linear-issues",
    "openai-chat",
    "anthropic-claude",
  ];
  const starterTools = await prisma.tool.findMany({ where: { slug: { in: STARTER_SLUGS } } });
  for (const tool of starterTools) {
    await prisma.installedTool.upsert({
      where: { workspaceId_toolId: { workspaceId: workspace.id, toolId: tool.id } },
      update: {},
      create: { workspaceId: workspace.id, toolId: tool.id },
    });
  }

  console.log("→ Seeding connections");
  for (const c of CONNECTIONS) {
    const existing = await prisma.connection.findFirst({
      where: { workspaceId: workspace.id, provider: c.provider },
    });
    if (existing) continue;
    await prisma.connection.create({
      data: {
        workspaceId: workspace.id,
        provider: c.provider,
        accountName: c.accountName,
        status: "connected",
        scopes: JSON.stringify(c.scopes),
        tokenStatus: "active",
        lastSyncedAt: new Date(),
      },
    });
  }

  console.log("→ Seeding agents");
  const createdAgents = [];
  for (const a of AGENTS) {
    const existing = await prisma.agent.findFirst({
      where: { workspaceId: workspace.id, name: a.name },
    });
    if (existing) {
      createdAgents.push(existing);
      continue;
    }
    const agent = await prisma.agent.create({
      data: {
        workspaceId: workspace.id,
        name: a.name,
        description: a.description,
        systemInstructions: a.systemInstructions,
        model: a.model,
        allowedTools: JSON.stringify(a.allowedTools),
        permissions: JSON.stringify(a.permissions),
        executionMode: a.executionMode,
        memoryAccess: "all",
        budgetLimit: 25,
        status: "active",
      },
    });
    createdAgents.push(agent);
  }

  console.log("→ Seeding memory");
  const emailAgent = createdAgents.find((a) => a.name === "Email Summary Agent");
  for (const m of MEMORY) {
    const existing = await prisma.memoryItem.findFirst({
      where: { workspaceId: workspace.id, title: m.title },
    });
    if (existing) continue;
    await prisma.memoryItem.create({
      data: {
        workspaceId: workspace.id,
        title: m.title,
        content: m.content,
        type: m.type,
        visibility: m.visibility,
        agentId: m.visibility === "agent" ? emailAgent?.id : null,
        embedding: buildEmbedding(`${m.title} ${m.content}`),
      },
    });
  }

  console.log("→ Seeding cron jobs");
  for (const c of CRON_JOBS) {
    const agent = createdAgents.find((a) => a.name === c.agentName);
    if (!agent) continue;
    const existing = await prisma.cronJob.findFirst({
      where: { workspaceId: workspace.id, name: c.name },
    });
    if (existing) continue;
    await prisma.cronJob.create({
      data: {
        workspaceId: workspace.id,
        agentId: agent.id,
        name: c.name,
        schedule: c.schedule,
        timezone: c.timezone,
        prompt: c.prompt,
        enabled: true,
        retryPolicy: "retry-3",
        nextRunAt: nextRunFromCron(),
      },
    });
  }

  console.log("→ Seeding A2A workflow");
  const research = createdAgents.find((a) => a.name === "Personal Research Agent");
  const planner = createdAgents.find((a) => a.name === "Calendar Planning Agent");
  const writer = createdAgents.find((a) => a.name === "Email Summary Agent");
  const qa = createdAgents.find((a) => a.name === "GitHub Triage Agent");

  if (research && planner && writer && qa) {
    const existing = await prisma.a2AWorkflow.findFirst({
      where: { workspaceId: workspace.id, name: "Weekly Plan Brief" },
    });
    if (!existing) {
      await prisma.a2AWorkflow.create({
        data: {
          workspaceId: workspace.id,
          name: "Weekly Plan Brief",
          description: "Research → Plan → Write → QA, end-to-end weekly brief.",
          inputTask: "Produce a brief on next week's launch readiness.",
          steps: {
            create: [
              { agentId: research.id, position: 0, prompt: "Research relevant context." },
              { agentId: planner.id, position: 1, prompt: "Create a structured plan." },
              { agentId: writer.id, position: 2, prompt: "Write the final brief." },
              { agentId: qa.id, position: 3, prompt: "QA the brief for accuracy." },
            ],
          },
        },
      });
    }
  }

  console.log("→ Seeding sample executions");
  const existingLogs = await prisma.executionLog.count({ where: { workspaceId: workspace.id } });
  if (existingLogs === 0) {
    const samples = [
      { agent: "Email Summary Agent", input: "Summarize today's inbox", status: "success" },
      { agent: "Personal Research Agent", input: "Latest news on MCP standards", status: "success" },
      { agent: "GitHub Triage Agent", input: "Review issue #482", status: "error", error: "Missing permission: write_code" },
      { agent: "Revenue Insights Agent", input: "Generate September MRR report", status: "success" },
    ];
    for (const s of samples) {
      const agent = createdAgents.find((a) => a.name === s.agent);
      if (!agent) continue;
      await prisma.executionLog.create({
        data: {
          workspaceId: workspace.id,
          agentId: agent.id,
          input: s.input,
          output: s.status === "success" ? `Completed task: ${s.input}` : null,
          toolsUsed: JSON.stringify([]),
          memoryUsed: JSON.stringify([]),
          status: s.status,
          latencyMs: 850 + Math.floor(Math.random() * 1500),
          estimatedCost: 0.012,
          errorMessage: s.error ?? null,
        },
      });
    }
  }

  console.log("→ Seeding API keys");
  const keyExisting = await prisma.apiKey.count({ where: { workspaceId: workspace.id } });
  if (keyExisting === 0) {
    await prisma.apiKey.createMany({
      data: [
        {
          workspaceId: workspace.id,
          provider: "openai",
          name: "Production OpenAI",
          maskedValue: "sk-pr••••••••f12a",
          encrypted: "AAAAAA==",
          status: "active",
        },
        {
          workspaceId: workspace.id,
          provider: "anthropic",
          name: "Anthropic Claude",
          maskedValue: "sk-an••••••••9zR2",
          encrypted: "AAAAAA==",
          status: "active",
        },
      ],
    });
  }

  console.log("✓ Seed complete. Login with:");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
