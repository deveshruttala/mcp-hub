import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tools = await prisma.tool.findMany();
  return NextResponse.json({
    tools: tools.map((t) => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
      category: t.category,
      endpoint: t.endpoint,
      status: t.status,
      rating: t.rating,
      permissions: safeJsonParse<string[]>(t.permissions, []),
    })),
  });
}
