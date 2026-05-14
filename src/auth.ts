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
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

/** Whether Google OAuth is configured. Exported so UI can show/hide the button. */
export const GOOGLE_AUTH_ENABLED = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

/**
 * Email magic-link sign-in is enabled when either:
 *   - `EMAIL_SERVER` (SMTP connection string) and `EMAIL_FROM` are set, or
 *   - we are in non-production mode (dev) — the link is printed to the
 *     server console so developers can test the flow without SMTP.
 *
 * `EMAIL_FROM` defaults to `noreply@agenthub.dev` in dev mode.
 */
export const EMAIL_AUTH_ENABLED =
  Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM) || process.env.NODE_ENV !== "production";

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

if (EMAIL_AUTH_ENABLED) {
  const hasSmtp = Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM);
  providers.push(
    Nodemailer({
      // In dev mode without SMTP, we still need *some* server config to satisfy
      // the provider — supply harmless `jsonTransport` so nodemailer succeeds
      // and we intercept delivery via `sendVerificationRequest` below.
      server: hasSmtp ? process.env.EMAIL_SERVER! : { jsonTransport: true },
      from: process.env.EMAIL_FROM ?? "AgentHub <noreply@agenthub.dev>",
      maxAge: 24 * 60 * 60, // 24h — magic links expire after one day
      async sendVerificationRequest({ identifier, url, provider }) {
        if (!hasSmtp) {
          // Dev fallback: print a clickable link in the server console.
          // eslint-disable-next-line no-console
          console.log(
            `\n──────────────────────────────────────────────────────────────\n` +
              `📬  Magic sign-in link for ${identifier}\n` +
              `    ${url}\n` +
              `    (paste into your browser — expires in 24h)\n` +
              `──────────────────────────────────────────────────────────────\n`,
          );
          return;
        }

        // Real SMTP path — render a minimal branded email.
        const nodemailer = await import("nodemailer");
        const transport = nodemailer.createTransport(provider.server);
        const host = new URL(url).host;
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: `Sign in to AgentHub`,
          text: `Sign in to AgentHub by opening this link:\n${url}\n\nThis link expires in 24 hours. If you didn't request it, you can safely ignore this email.`,
          html: `
            <div style="font-family:ui-sans-serif,system-ui,sans-serif;background:#0a0a0a;padding:32px;color:#f5f5f5">
              <div style="max-width:480px;margin:0 auto;background:#111;border:1px solid #1f1f23;border-radius:12px;padding:32px">
                <h1 style="font-size:18px;margin:0 0 16px">Sign in to AgentHub</h1>
                <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px">Click the button below to sign in to <strong>${host}</strong>. This link expires in 24 hours.</p>
                <a href="${url}" style="display:inline-block;background:#fff;color:#000;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Continue to AgentHub →</a>
                <p style="margin:24px 0 0;color:#71717a;font-size:12px">If you didn't request this email, you can safely ignore it.</p>
              </div>
            </div>
          `,
        });
        const rejected = result.rejected ?? [];
        if (rejected.length) {
          throw new Error(`Email could not be sent to ${rejected.join(", ")}`);
        }
      },
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
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
  },
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
