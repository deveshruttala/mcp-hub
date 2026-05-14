# AgentHub

> One login, one memory, one tool hub for every AI agent.

AgentHub is a production-quality MVP of a universal **MCP + AI agent operating system**. Connect your apps once, write memory once, manage permissions once — every AI app (ChatGPT, Claude, Cursor, Gemini, custom agents) talks to AgentHub through a hosted MCP/REST gateway.

This repo is a complete Next.js 15 SaaS app with:

- Auth: **email magic link** + **Google OAuth** + email/password — all via NextAuth v5, with rate-limited signup
- Modern dashboard SaaS UI (Tailwind + shadcn-style components)
- **MCP tool marketplace seeded with 100+ real-world tools** across 17 categories (Gmail, GitHub, Slack, Notion, Stripe, Postgres, BigQuery, Snowflake, OpenAI, Anthropic, Pinecone, Firecrawl, etc.) with category filter and live search
- Connections (Google, GitHub, Slack, Notion, Stripe, Linear, Supabase, custom)
- Universal memory with semantic search and agent context preview
- Agent management with tools, permissions, memory access, budgets
- Test run / simulated execution engine with permission checks
- Cron agents with Run Now button
- A2A workflows (Research → Plan → Write → QA) with execution traces
- Permissions catalog and audit
- Encrypted API key vault
- Execution logs with filters
- Hosted MCP/API gateway (`/api/agent/run`, `/api/a2a/run`, `/api/mcp/tools`, `/api/memory/search`, `/api/cron/run-now`, `/api/health`)
- Public landing page
- Realistic seeded sample data
- **Production hardening**: AES-256-GCM vault encryption, env validation at boot, security headers (HSTS, X-Frame-Options, Permissions-Policy, COOP), rate-limited public endpoints, health check

## Tech stack

- [Next.js 15](https://nextjs.org/) App Router + Server Actions
- TypeScript, strict mode
- Tailwind CSS + shadcn/ui-style component library
- [Prisma](https://www.prisma.io/) (SQLite by default, Postgres-ready)
- [NextAuth.js v5](https://authjs.dev/) (credentials + optional Google)
- Zod for input validation
- Redis-ready queue abstraction (`src/lib/services/queue.ts`)
- Vector memory abstraction (Postgres-friendly token-frequency embeddings)

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Initialise the database (SQLite, instant)
npx prisma migrate dev --name init

# 4. Seed sample data (creates demo workspace, tools, agents, memory…)
npx prisma db seed

# 5. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the demo credentials:

```
email:    demo@agenthub.dev
password: demo1234
```

## Enabling email magic-link sign-in

The "Email me a sign-in link" tab is enabled out of the box.

- **Development**: with `EMAIL_SERVER` unset, the magic link is printed to
  your dev-server console — copy it into your browser to sign in. Use this to
  test the flow without SMTP.
- **Production**: set both env vars in `.env`:
  ```env
  EMAIL_SERVER="smtp://user:password@smtp.example.com:587"
  EMAIL_FROM="AgentHub <noreply@your-domain.com>"
  ```
  Any SMTP relay works (Gmail with app password, Resend, Postmark, SES,
  SendGrid, etc.). Tokens live in the `VerificationToken` table and expire
  after 24 hours.

## Enabling Google OAuth

The "Continue with Google" button only renders when Google credentials are
configured — local development without OAuth still works via the email
demo login.

1. Open the [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**.
2. Create an **OAuth 2.0 Client ID** of type *Web application*.
3. Add the redirect URI for each environment:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://<your-domain>/api/auth/callback/google` (production)
4. Paste the Client ID and Client Secret into `.env`:
   ```env
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   ```
5. Restart the dev server. The button will appear on `/login` and `/signup`.

First-time OAuth users automatically get a personal workspace via the
`events.signIn` hook in `src/auth.ts`.

## Switching to Postgres

The MVP uses SQLite for zero-config startup. To use Postgres:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` in `.env` to a Postgres connection string.
3. Run `npx prisma migrate dev --name init` again.

## Project structure

```
src/
├── app/
│   ├── (app)/            # Authenticated SaaS dashboard
│   │   ├── dashboard/
│   │   ├── marketplace/
│   │   ├── connections/
│   │   ├── memory/
│   │   ├── agents/
│   │   ├── cron/
│   │   ├── a2a/
│   │   ├── permissions/
│   │   ├── vault/
│   │   ├── logs/
│   │   └── settings/
│   ├── (auth)/           # Login & signup
│   ├── api/              # Hosted MCP/API gateway + auth routes
│   └── page.tsx          # Landing page
├── auth.ts               # NextAuth config
├── components/
│   ├── ui/               # Reusable primitives (Button, Card, etc.)
│   └── layout/           # Sidebar, topbar, mobile nav
└── lib/
    ├── db.ts             # Prisma singleton
    ├── permissions.ts    # PERMISSIONS catalog + checker
    ├── crypto.ts         # Encryption abstraction
    ├── workspace.ts      # requireWorkspace / requireUser helpers
    └── services/
        ├── execution.ts  # Mocked agent + workflow execution engine
        ├── memory.ts     # Token-frequency vector memory
        └── queue.ts      # Redis-ready queue abstraction
```

## API gateway

All endpoints are session-protected.

| Method | Path                           | Body                                              |
|--------|--------------------------------|---------------------------------------------------|
| POST   | `/api/agent/run`               | `{ agentId, input }`                              |
| POST   | `/api/a2a/run`                 | `{ workflowId, inputTask }`                       |
| GET    | `/api/mcp/tools`               | —                                                 |
| POST   | `/api/mcp/tools/install`       | `{ slug }`                                        |
| POST   | `/api/memory/search`           | `{ query, agentId?, limit? }`                     |
| POST   | `/api/cron/run-now`            | `{ cronId }`                                      |
| POST   | `/api/auth/signup`             | `{ name, email, password }`                       |
| GET/POST | `/api/auth/[...nextauth]`    | NextAuth.js handlers                              |
| GET    | `/api/health`                  | DB-backed health check for load balancers         |

## Permission model

Every agent declares granted permissions. Every tool declares required permissions. Before execution, the engine intersects them — if the agent is missing a required permission the call fails with a structured `Permission denied — missing: …` error and the failure is written to the execution log.

Defined in `src/lib/permissions.ts`:

```
read_email, send_email, read_calendar, write_calendar,
read_files, write_files, read_code, write_code,
access_payments, external_web, run_code, use_memory,
call_other_agents
```

## Scripts

| Script                | Description                                  |
|-----------------------|----------------------------------------------|
| `npm run dev`         | Start the dev server                         |
| `npm run build`       | `prisma generate` + `next build`             |
| `npm run start`       | Run the built app                            |
| `npm run db:migrate`  | Run a fresh migration named `init`           |
| `npm run db:push`     | Push schema (no migration history)           |
| `npm run db:seed`     | Seed demo workspace + sample data            |
| `npm run db:reset`    | Drop, re-migrate, and re-seed                |

## Production hardening checklist

- ✅ AES-256-GCM authenticated encryption for the vault (`lib/crypto.ts`).
- ✅ Env validation at boot (`lib/env.ts`).
- ✅ Security headers via Edge middleware (`src/middleware.ts`).
- ✅ Rate limiting on public endpoints (`lib/services/rate-limit.ts`).
- ✅ DB-backed health check (`/api/health`).
- 🔁 Replace `lib/crypto.ts` envelope key with AWS KMS / GCP KMS in prod.
- 🔁 Replace `services/queue.ts` in-memory queue with BullMQ + Redis or Upstash.
- Wire `services/execution.ts` to your model provider (OpenAI / Anthropic / etc.).
- Replace token-frequency embeddings with `pgvector` or a managed vector store.
- Add real cron orchestration (e.g. `pg-cron`, `Inngest`, or a worker process).
- Enforce workspace billing limits (free plan limits are surfaced in the UI but not enforced at write time yet).
- Add SOC2-grade audit log table.

## License

MIT — build your own AI agent OS on top of this MVP.
