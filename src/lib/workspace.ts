/**
 * Workspace + auth helpers used by every authenticated server component.
 *
 * `requireUser` redirects unauthenticated requests to `/login`.
 * `requireWorkspace` lazily creates the user's first workspace if none
 * exists yet, ensuring fresh users always land on a usable dashboard.
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function requireWorkspace() {
  const user = await requireUser();
  let member = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  if (!member) {
    const workspace = await prisma.workspace.create({
      data: {
        name: `${user.name ?? user.email ?? "My"} Workspace`,
        slug: `ws-${user.id.slice(0, 8)}`,
        members: {
          create: { userId: user.id, role: "owner" },
        },
      },
    });
    member = await prisma.workspaceMember.findFirst({
      where: { workspaceId: workspace.id, userId: user.id },
      include: { workspace: true },
    });
  }

  if (!member) redirect("/login");
  return { user, workspace: member.workspace, role: member.role };
}

export async function getWorkspaceFromRequest() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  return member ? { user: session.user, workspace: member.workspace } : null;
}
