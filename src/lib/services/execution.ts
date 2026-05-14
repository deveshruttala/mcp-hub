/**
 * Agent + workflow execution engine
 * ----------------------------------------------------------------------------
 * The MVP runs a *deterministic simulation* of an LLM agent loop so the
 * application is fully exercisable without an API key. The simulation:
 *
 *   1. Loads the agent and validates ownership of the requesting workspace.
 *   2. Resolves the union of permissions required by the agent's allowed
 *      tools, and verifies every required permission is granted.
 *   3. Retrieves relevant workspace memory, scoped by the agent's
 *      `memoryAccess` setting (`all` | `linked` | `none`).
 *   4. Calls each tool via a mocked response table.
 *   5. Persists an `ExecutionLog` row with latency, cost, tools, memory ids.
 *
 * To switch to a real model in production, replace the `MOCK_TOOL_RESPONSES`
 * lookup and the synthesised "Final answer" string with a model call (OpenAI,
 * Anthropic, Gemini). Everything else — permissions, memory retrieval, log
 * persistence — is already production-shaped.
 */

import { prisma } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";
import { checkPermissions } from "@/lib/permissions";
import { gatherAgentMemory } from "@/lib/services/memory";

interface RunAgentInput {
  workspaceId: string;
  agentId: string;
  input: string;
  workflowId?: string;
}

interface RunAgentResult {
  ok: boolean;
  output?: string;
  logId: string;
  error?: string;
  toolsUsed: string[];
  memoryUsed: { id: string; title: string; score: number }[];
  latencyMs: number;
  estimatedCost: number;
}

const MOCK_TOOL_RESPONSES: Record<string, string> = {
  "gmail-reader": "Pulled 12 unread Gmail threads — 3 high priority.",
  "google-calendar": "You have 4 events tomorrow; 1 conflict at 14:00.",
  "github-issue-agent": "8 open issues; 2 critical bugs need triage.",
  "slack-summarizer": "#general had 27 new messages. Top topics: launch, release notes.",
  "notion-knowledge-base": "Found 3 relevant docs in Notion: PRD v2, OKR Q3, Onboarding.",
  "web-research": "Researched topic: 5 sources synthesized into a brief.",
  "file-analyzer": "Analyzed report.pdf: 142 pages, 18 charts, 4 KPIs.",
  "stripe-revenue": "MRR is $42.8k (+6.4% MoM). Top plan: Pro Annual.",
};

export async function runAgent(input: RunAgentInput): Promise<RunAgentResult> {
  const startedAt = Date.now();

  const agent = await prisma.agent.findUnique({
    where: { id: input.agentId },
    include: { workspace: true },
  });

  if (!agent || agent.workspaceId !== input.workspaceId) {
    const log = await prisma.executionLog.create({
      data: {
        workspaceId: input.workspaceId,
        agentId: null,
        workflowId: input.workflowId,
        input: input.input,
        toolsUsed: "[]",
        memoryUsed: "[]",
        status: "error",
        errorMessage: "Agent not found",
      },
    });
    return {
      ok: false,
      logId: log.id,
      error: "Agent not found",
      toolsUsed: [],
      memoryUsed: [],
      latencyMs: 0,
      estimatedCost: 0,
    };
  }

  if (agent.status !== "active") {
    const log = await prisma.executionLog.create({
      data: {
        workspaceId: agent.workspaceId,
        agentId: agent.id,
        workflowId: input.workflowId,
        input: input.input,
        toolsUsed: "[]",
        memoryUsed: "[]",
        status: "error",
        errorMessage: "Agent is not active",
      },
    });
    return {
      ok: false,
      logId: log.id,
      error: "Agent is inactive",
      toolsUsed: [],
      memoryUsed: [],
      latencyMs: 0,
      estimatedCost: 0,
    };
  }

  const allowedToolSlugs = safeJsonParse<string[]>(agent.allowedTools, []);
  const grantedPermissions = safeJsonParse<string[]>(agent.permissions, []);

  const tools = await prisma.tool.findMany({ where: { slug: { in: allowedToolSlugs } } });

  const requiredPermissions = new Set<string>();
  for (const tool of tools) {
    for (const p of safeJsonParse<string[]>(tool.permissions, [])) {
      requiredPermissions.add(p);
    }
  }
  requiredPermissions.add("use_memory");

  const permCheck = checkPermissions(grantedPermissions, [...requiredPermissions]);
  if (!permCheck.ok) {
    const log = await prisma.executionLog.create({
      data: {
        workspaceId: agent.workspaceId,
        agentId: agent.id,
        workflowId: input.workflowId,
        input: input.input,
        toolsUsed: "[]",
        memoryUsed: "[]",
        status: "error",
        errorMessage: `Missing permissions: ${permCheck.missing.join(", ")}`,
      },
    });
    return {
      ok: false,
      logId: log.id,
      error: `Permission denied — missing: ${permCheck.missing.join(", ")}`,
      toolsUsed: [],
      memoryUsed: [],
      latencyMs: Date.now() - startedAt,
      estimatedCost: 0,
    };
  }

  const memoryHits = await gatherAgentMemory({
    workspaceId: agent.workspaceId,
    agentId: agent.id,
    query: input.input,
    memoryAccess: agent.memoryAccess,
  });

  const memorySummary = memoryHits
    .slice(0, 4)
    .map((h) => `• ${h.item.title}: ${h.item.content.slice(0, 120)}`)
    .join("\n");

  const toolOutputs = tools
    .map((t) => `→ ${t.name}: ${MOCK_TOOL_RESPONSES[t.slug] ?? "Executed successfully (mock)."}`)
    .join("\n");

  const output = [
    `# Agent: ${agent.name}`,
    `Model: ${agent.model}`,
    `Task: ${input.input}`,
    "",
    "## Plan",
    "1. Retrieve relevant memory",
    "2. Call allowed MCP tools",
    "3. Synthesize answer",
    "",
    memoryHits.length ? "## Memory used" : "## Memory used\n(no relevant memory)",
    memorySummary,
    "",
    tools.length ? "## Tool calls" : "## Tool calls\n(no tools called)",
    toolOutputs,
    "",
    "## Final answer",
    `Based on ${tools.length} tool(s) and ${memoryHits.length} memory item(s), here is the synthesized response to "${input.input}". This is a mocked execution from the AgentHub MVP runtime — wire up your model provider in lib/services/execution.ts.`,
  ]
    .filter(Boolean)
    .join("\n");

  const latencyMs = 600 + Math.floor(Math.random() * 1200);
  const estimatedCost = Number((0.0015 + tools.length * 0.0008 + memoryHits.length * 0.0002).toFixed(4));

  await new Promise((r) => setTimeout(r, 250));

  const log = await prisma.executionLog.create({
    data: {
      workspaceId: agent.workspaceId,
      agentId: agent.id,
      workflowId: input.workflowId,
      input: input.input,
      output,
      toolsUsed: JSON.stringify(tools.map((t) => t.slug)),
      memoryUsed: JSON.stringify(memoryHits.map((m) => m.item.id)),
      status: "success",
      latencyMs,
      estimatedCost,
    },
  });

  return {
    ok: true,
    output,
    logId: log.id,
    toolsUsed: tools.map((t) => t.slug),
    memoryUsed: memoryHits.map((m) => ({ id: m.item.id, title: m.item.title, score: Number(m.score.toFixed(2)) })),
    latencyMs,
    estimatedCost,
  };
}

export async function runWorkflow(opts: { workspaceId: string; workflowId: string; inputTask: string }) {
  const wf = await prisma.a2AWorkflow.findUnique({
    where: { id: opts.workflowId },
    include: { steps: { orderBy: { position: "asc" }, include: { agent: true } } },
  });
  if (!wf || wf.workspaceId !== opts.workspaceId) {
    throw new Error("Workflow not found");
  }

  const trace: { stepId: string; agentName: string; output: string; ok: boolean; latencyMs: number }[] = [];
  let lastOutput = opts.inputTask;

  for (const step of wf.steps) {
    const stepInput = step.prompt ? `${step.prompt}\n\nContext from previous step:\n${lastOutput}` : lastOutput;
    const result = await runAgent({
      workspaceId: opts.workspaceId,
      agentId: step.agentId,
      input: stepInput,
      workflowId: wf.id,
    });
    trace.push({
      stepId: step.id,
      agentName: step.agent.name,
      output: result.output ?? result.error ?? "(no output)",
      ok: result.ok,
      latencyMs: result.latencyMs,
    });
    if (!result.ok) break;
    lastOutput = result.output ?? lastOutput;
  }

  return { workflowId: wf.id, finalOutput: lastOutput, trace };
}
