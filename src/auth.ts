/**
 * NextAuth.js v5 configuration
 * ----------------------------------------------------------------------------
 * Auth strategy: JWT sessions (no DB session lookups on every request) backed
 * by the Prisma adapter for user / account persistence.
 *
 * Providers:
 *   - Credentials (email + bcrypt password) — always enabled.
 *   - Google OAuth — only registered when `GOOGLE_CLIENT_ID` and
 *     `GOOGLE_CLIENT_SECRET` are present so local dev works without OAuth.
 *
 * First-time OAuth sign-ins automatically receive a personal workspace via
 * the `events.signIn` hook so they land on a usable dashboard.
 */

import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

/** Whether Google OAuth is configured. Exported so UI can show/hide the button. */
export const GOOGLE_AUTH_ENABLED = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      workspaceId?: string;
    } & DefaultSession["user"];
  }
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "").toLowerCase().trim();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) return null;

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
      };
    },
  }),
];

if (GOOGLE_AUTH_ENABLED) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // PKCE + state are handled automatically. We pre-approve email scope so
      // first-time users land directly back on /dashboard.
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
      // Trust the provider's verified-email flag — eliminates one DB lookup.
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

/**
 * Ensure every signed-in user owns at least one workspace. Runs on every
 * sign-in but is cheap because the existence check is indexed.
 */
async function ensureWorkspaceFor(userId: string, displayName: string) {
  const member = await prisma.workspaceMember.findFirst({ where: { userId } });
  if (member) return;
  const base = slugify(displayName) || "workspace";
  await prisma.workspace.create({
    data: {
      name: `${displayName}'s Workspace`,
      slug: `${base}-${userId.slice(0, 6)}`,
      members: { create: { userId, role: "owner" } },
    },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        const member = await prisma.workspaceMember.findFirst({
          where: { userId: token.id as string },
          orderBy: { createdAt: "asc" },
        });
        session.user.workspaceId = member?.workspaceId;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user?.id) return;
      const displayName = user.name ?? user.email?.split("@")[0] ?? "My";
      await ensureWorkspaceFor(user.id, displayName);
    },
  },
});
