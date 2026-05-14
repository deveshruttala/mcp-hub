/**
 * Workspace memory service
 * ----------------------------------------------------------------------------
 * Stores and retrieves agent-accessible memory items. The MVP uses a
 * token-frequency vector (a tiny inverted index serialised to JSON) so the
 * implementation is self-contained and works against SQLite.
 *
 * Production swap path: replace `buildEmbedding` with calls to a real
 * embedding model (OpenAI text-embedding-3-small, Cohere, Vertex) and store
 * vectors in a `pgvector` column for ANN retrieval.
 */

import { prisma } from "@/lib/db";

// Tiny token-frequency "embedding" so search works without external services.
function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function buildEmbedding(text: string): Record<string, number> {
  const tokens = tokenize(text);
  const map: Record<string, number> = {};
  for (const t of tokens) {
    if (t.length < 3) continue;
    map[t] = (map[t] ?? 0) + 1;
  }
  return map;
}

function cosine(a: Record<string, number>, b: Record<string, number>) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const v of Object.values(a)) normA += v * v;
  for (const v of Object.values(b)) normB += v * v;
  for (const k of Object.keys(a)) {
    if (b[k]) dot += a[k] * b[k];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchMemory(opts: {
  workspaceId: string;
  query: string;
  agentId?: string;
  limit?: number;
}) {
  const { workspaceId, query, agentId, limit = 5 } = opts;
  if (!query.trim()) return [];

  const items = await prisma.memoryItem.findMany({
    where: {
      workspaceId,
      OR: [{ visibility: { in: ["private", "team"] } }, { agentId: agentId ?? undefined }],
    },
  });

  const q = buildEmbedding(query);
  const scored = items.map((m) => {
    const e = m.embedding ? (JSON.parse(m.embedding) as Record<string, number>) : buildEmbedding(`${m.title} ${m.content}`);
    return { item: m, score: cosine(q, e) };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function gatherAgentMemory(opts: {
  workspaceId: string;
  agentId: string;
  query: string;
  memoryAccess: string;
}) {
  if (opts.memoryAccess === "none") return [];
  if (opts.memoryAccess === "linked") {
    const items = await prisma.memoryItem.findMany({
      where: { workspaceId: opts.workspaceId, agentId: opts.agentId },
    });
    return items.map((item) => ({ item, score: 1 }));
  }
  return searchMemory({ workspaceId: opts.workspaceId, query: opts.query, agentId: opts.agentId });
}
