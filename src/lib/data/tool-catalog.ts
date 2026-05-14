/**
 * AgentHub — MCP / plugin starter catalog
 * ----------------------------------------------------------------------------
 * A curated catalog of 100+ real-world tools spanning the most popular
 * categories an AI agent would want on day one. The catalog is the source of
 * truth for both the seeded marketplace and the public `/api/mcp/tools`
 * gateway.
 *
 * Each entry intentionally avoids vendor logos / proprietary brand assets;
 * names reflect the public capability of the underlying service and the
 * `endpoint` is a placeholder MCP URL hosted under the `agenthub.dev` zone
 * for the MVP. Swap in real MCP servers in production.
 */

export interface ToolCatalogEntry {
  /** URL-safe identifier, unique across the catalog. */
  slug: string;
  /** Human-readable name shown in the marketplace. */
  name: string;
  /** One-sentence description shown in cards and tooltips. */
  description: string;
  /** High-level grouping used for filters and navigation. */
  category: ToolCategory;
  /** Mocked MCP endpoint — swap to your real MCP server URL. */
  endpoint: string;
  /** 1.0 - 5.0, used for sort/order in the marketplace. */
  rating: number;
  /** Lifecycle indicator surfaced as a badge in the UI. */
  status: "stable" | "beta" | "alpha";
  /** Permissions the tool requires before execution is allowed. */
  permissions: string[];
}

export type ToolCategory =
  | "Productivity"
  | "Communication"
  | "Engineering"
  | "Knowledge"
  | "Research"
  | "Finance"
  | "Marketing"
  | "Sales"
  | "Design"
  | "Data"
  | "Storage"
  | "DevOps"
  | "Security"
  | "Analytics"
  | "Customer Support"
  | "AI / ML"
  | "Web";

/** Helper used to keep entries terse below. */
function tool(
  slug: string,
  name: string,
  description: string,
  category: ToolCategory,
  permissions: string[],
  options: Partial<Pick<ToolCatalogEntry, "rating" | "status">> = {},
): ToolCatalogEntry {
  return {
    slug,
    name,
    description,
    category,
    permissions,
    endpoint: `https://mcp.agenthub.dev/tools/${slug}`,
    rating: options.rating ?? 4.5,
    status: options.status ?? "stable",
  };
}

/**
 * 100+ starter tools available to every workspace. Seeded automatically.
 * Keep entries sorted alphabetically inside each category for easy review.
 */
export const TOOL_CATALOG: ToolCatalogEntry[] = [
  // ── Productivity ─────────────────────────────────────────────────────────
  tool("gmail-reader", "Gmail Reader", "Read, search, and summarize Gmail threads and labels.", "Productivity", ["read_email", "use_memory"], { rating: 4.8 }),
  tool("gmail-sender", "Gmail Sender", "Draft and send emails on behalf of the user with templates.", "Productivity", ["send_email"], { rating: 4.7 }),
  tool("google-calendar", "Google Calendar Manager", "Create, update, and analyze calendar events.", "Productivity", ["read_calendar", "write_calendar"], { rating: 4.7 }),
  tool("outlook-mail", "Outlook Mail", "Read and triage Microsoft 365 inboxes.", "Productivity", ["read_email"], { rating: 4.4 }),
  tool("outlook-calendar", "Outlook Calendar", "Schedule, move, and brief Outlook meetings.", "Productivity", ["read_calendar", "write_calendar"], { rating: 4.4 }),
  tool("zoom-meetings", "Zoom Meetings", "Schedule, summarize, and follow-up on Zoom calls.", "Productivity", ["read_calendar", "write_calendar", "use_memory"], { rating: 4.5 }),
  tool("calendly", "Calendly", "Create scheduling links, view bookings, follow-ups.", "Productivity", ["read_calendar", "write_calendar"]),
  tool("todoist", "Todoist", "Create and prioritise tasks with natural language.", "Productivity", ["read_files", "write_files"]),
  tool("trello", "Trello", "Manage Trello boards, cards, and checklists.", "Productivity", ["read_files", "write_files"]),
  tool("asana", "Asana", "Track and update Asana tasks and projects.", "Productivity", ["read_files", "write_files"]),
  tool("monday", "Monday.com", "Operate Monday boards and pulses programmatically.", "Productivity", ["read_files", "write_files"]),
  tool("clickup", "ClickUp", "Search, create, and report on ClickUp work.", "Productivity", ["read_files", "write_files"]),

  // ── Communication ────────────────────────────────────────────────────────
  tool("slack-summarizer", "Slack Summarizer", "Summarize Slack channels, threads, and DM digests.", "Communication", ["read_files", "use_memory"], { rating: 4.6 }),
  tool("slack-poster", "Slack Poster", "Send messages, alerts, and rich blocks to Slack.", "Communication", ["send_email", "external_web"]),
  tool("discord-bot", "Discord Bot", "Read and post to Discord channels and threads.", "Communication", ["read_files", "external_web"]),
  tool("microsoft-teams", "Microsoft Teams", "Read and reply to Teams chats and channels.", "Communication", ["read_files", "send_email"]),
  tool("twilio-sms", "Twilio SMS", "Send and receive SMS, MMS, and WhatsApp messages.", "Communication", ["send_email", "external_web"]),
  tool("twilio-voice", "Twilio Voice", "Place and transcribe voice calls programmatically.", "Communication", ["external_web", "use_memory"]),
  tool("intercom", "Intercom", "Triage and reply to Intercom conversations.", "Customer Support", ["read_files", "send_email"]),
  tool("zendesk", "Zendesk", "Search tickets and respond to customers.", "Customer Support", ["read_files", "send_email"]),
  tool("freshdesk", "Freshdesk", "Triage Freshdesk tickets and macros.", "Customer Support", ["read_files", "send_email"]),
  tool("crisp-chat", "Crisp Chat", "Live-chat triage and proactive replies.", "Customer Support", ["read_files", "send_email"]),
  tool("front-app", "Front", "Shared inbox triage across email and channels.", "Communication", ["read_email", "send_email"]),

  // ── Engineering ──────────────────────────────────────────────────────────
  tool("github-issue-agent", "GitHub Issue Agent", "Triage, label, and respond to GitHub issues automatically.", "Engineering", ["read_code", "write_code"], { rating: 4.9 }),
  tool("github-pr-reviewer", "GitHub PR Reviewer", "Review pull requests, request changes, summarize diffs.", "Engineering", ["read_code", "write_code"], { rating: 4.8 }),
  tool("gitlab", "GitLab", "Operate GitLab repos, MRs, pipelines, and issues.", "Engineering", ["read_code", "write_code"]),
  tool("bitbucket", "Bitbucket", "Read repos and review Bitbucket pull requests.", "Engineering", ["read_code", "write_code"]),
  tool("jira-issues", "Jira Issues", "Search and update Jira issues and sprints.", "Engineering", ["read_files", "write_files"]),
  tool("linear-issues", "Linear", "Create, triage, and update Linear issues and cycles.", "Engineering", ["read_files", "write_files"], { rating: 4.7 }),
  tool("sentry-errors", "Sentry", "Read and group production error events.", "Engineering", ["read_code", "external_web"]),
  tool("datadog", "Datadog", "Query logs, metrics, monitors, and SLO burn rates.", "DevOps", ["read_files", "external_web"]),
  tool("new-relic", "New Relic", "Query NRQL, monitor incidents, and APM data.", "DevOps", ["read_files", "external_web"]),
  tool("pagerduty", "PagerDuty", "Acknowledge and triage paging incidents.", "DevOps", ["read_files", "external_web"]),
  tool("opsgenie", "Opsgenie", "Alert routing and on-call rotations.", "DevOps", ["read_files", "external_web"]),
  tool("vercel", "Vercel", "Inspect deployments, environments, and domains.", "DevOps", ["read_code", "external_web"]),
  tool("netlify", "Netlify", "Deploy, roll back, and inspect Netlify sites.", "DevOps", ["read_code", "external_web"]),
  tool("aws-ec2", "AWS EC2", "List, start, and stop EC2 instances safely.", "DevOps", ["external_web", "run_code"], { status: "beta" }),
  tool("aws-s3", "AWS S3", "Read and write objects in S3 buckets.", "Storage", ["read_files", "write_files"]),
  tool("aws-lambda", "AWS Lambda", "Invoke Lambda functions and inspect logs.", "DevOps", ["external_web", "run_code"], { status: "beta" }),
  tool("gcp-compute", "GCP Compute", "Manage Google Cloud compute resources.", "DevOps", ["external_web", "run_code"], { status: "beta" }),
  tool("gcp-storage", "GCP Storage", "Read/write GCS buckets and signed URLs.", "Storage", ["read_files", "write_files"]),
  tool("azure-resources", "Azure Resources", "Inspect Azure resource groups and resources.", "DevOps", ["external_web"], { status: "beta" }),
  tool("kubernetes", "Kubernetes", "Inspect pods, deployments, and apply manifests.", "DevOps", ["read_code", "run_code"], { status: "beta" }),
  tool("docker", "Docker", "List images and run containers in a sandbox.", "DevOps", ["run_code"], { status: "beta" }),
  tool("terraform", "Terraform Cloud", "Plan and apply Terraform changes with approvals.", "DevOps", ["read_code", "write_code", "external_web"], { status: "beta" }),
  tool("circleci", "CircleCI", "Trigger and inspect CircleCI workflows.", "DevOps", ["read_code", "external_web"]),
  tool("github-actions", "GitHub Actions", "Run, re-run, and inspect Actions workflows.", "DevOps", ["read_code", "external_web"]),

  // ── Knowledge ────────────────────────────────────────────────────────────
  tool("notion-knowledge-base", "Notion Knowledge Base", "Query and update Notion pages, databases, and docs.", "Knowledge", ["read_files", "write_files"]),
  tool("confluence", "Confluence", "Search and update Confluence pages and spaces.", "Knowledge", ["read_files", "write_files"]),
  tool("obsidian-vault", "Obsidian Vault", "Read and append notes to a synced vault.", "Knowledge", ["read_files", "write_files"]),
  tool("readwise", "Readwise", "Search and summarize highlights from books and articles.", "Knowledge", ["read_files", "use_memory"]),
  tool("google-drive", "Google Drive", "Search, summarize, and download Drive files.", "Storage", ["read_files"]),
  tool("dropbox", "Dropbox", "Browse and analyze Dropbox files.", "Storage", ["read_files"]),
  tool("box-storage", "Box", "Read and operate on Box files and folders.", "Storage", ["read_files", "write_files"]),
  tool("onedrive", "OneDrive", "Search and read OneDrive documents.", "Storage", ["read_files"]),
  tool("file-analyzer", "File Analyzer", "Parse PDFs, spreadsheets, and docs to extract key insights.", "Knowledge", ["read_files"]),
  tool("docusign", "DocuSign", "Send, track, and recap document signatures.", "Productivity", ["read_files", "send_email"]),

  // ── Research ─────────────────────────────────────────────────────────────
  tool("web-research", "Web Research", "Browse the web, summarize sources, and synthesize briefs.", "Research", ["external_web", "use_memory"], { rating: 4.4, status: "beta" }),
  tool("brave-search", "Brave Search", "Privacy-first web search with structured results.", "Research", ["external_web"]),
  tool("perplexity-search", "Perplexity Search", "Cited research answers with source URLs.", "Research", ["external_web", "use_memory"]),
  tool("tavily-search", "Tavily Search", "AI-optimised search and answer engine.", "Research", ["external_web"]),
  tool("serpapi", "SerpAPI", "Search engine results pages as structured JSON.", "Research", ["external_web"]),
  tool("wikipedia", "Wikipedia", "Search and summarize Wikipedia articles.", "Research", ["external_web"]),
  tool("arxiv", "arXiv", "Search recent academic papers and abstracts.", "Research", ["external_web"]),
  tool("hacker-news", "Hacker News", "Trending tech topics and threaded discussions.", "Research", ["external_web"]),
  tool("reddit-reader", "Reddit Reader", "Read subreddits and threads for context.", "Research", ["external_web"]),
  tool("youtube-transcripts", "YouTube Transcripts", "Search and analyse YouTube transcripts.", "Research", ["external_web", "use_memory"]),

  // ── Finance / Sales ──────────────────────────────────────────────────────
  tool("stripe-revenue", "Stripe Revenue Reporter", "Pull Stripe metrics and generate finance summaries.", "Finance", ["access_payments"], { rating: 4.7 }),
  tool("stripe-billing", "Stripe Billing", "Manage subscriptions, invoices, and refunds (read).", "Finance", ["access_payments"]),
  tool("paddle-billing", "Paddle", "Inspect Paddle subscriptions and revenue.", "Finance", ["access_payments"]),
  tool("quickbooks", "QuickBooks", "Read accounting data and reconciliations.", "Finance", ["access_payments", "read_files"]),
  tool("xero-accounting", "Xero", "Inspect Xero ledgers and invoices.", "Finance", ["access_payments", "read_files"]),
  tool("plaid-finance", "Plaid", "Read connected bank balances and transactions.", "Finance", ["access_payments"], { status: "beta" }),
  tool("mercury-banking", "Mercury", "Read business banking balances and statements.", "Finance", ["access_payments"], { status: "beta" }),
  tool("hubspot-crm", "HubSpot CRM", "Search and update HubSpot deals, contacts, tickets.", "Sales", ["read_files", "write_files", "send_email"]),
  tool("salesforce-crm", "Salesforce CRM", "Operate Salesforce SObjects and reports.", "Sales", ["read_files", "write_files"]),
  tool("pipedrive", "Pipedrive", "Manage deals and pipelines in Pipedrive.", "Sales", ["read_files", "write_files"]),
  tool("apollo-prospecting", "Apollo Prospecting", "Find prospects, enrich emails, and sequence outreach.", "Sales", ["read_files", "send_email", "external_web"]),
  tool("clearbit-enrich", "Clearbit", "Enrich company and person data with one call.", "Sales", ["external_web"]),

  // ── Marketing / Design ───────────────────────────────────────────────────
  tool("mailchimp", "Mailchimp", "Manage email campaigns and audiences.", "Marketing", ["send_email", "read_files"]),
  tool("sendgrid", "SendGrid", "Transactional and marketing email delivery.", "Marketing", ["send_email"]),
  tool("postmark", "Postmark", "Send and inspect transactional email logs.", "Marketing", ["send_email", "read_files"]),
  tool("buffer-social", "Buffer", "Schedule and analyse social posts.", "Marketing", ["external_web", "send_email"]),
  tool("hootsuite-social", "Hootsuite", "Multi-network social posting and analytics.", "Marketing", ["external_web"]),
  tool("twitter-x", "X / Twitter", "Read timelines, post tweets, and pull metrics.", "Marketing", ["external_web", "send_email"]),
  tool("linkedin-pages", "LinkedIn Pages", "Post and analyse LinkedIn page activity.", "Marketing", ["external_web"]),
  tool("instagram-graph", "Instagram Graph", "Post media and read insights for business accounts.", "Marketing", ["external_web"]),
  tool("tiktok-business", "TikTok for Business", "Read campaign analytics and post drafts.", "Marketing", ["external_web"], { status: "beta" }),
  tool("figma-files", "Figma", "Read frames, comments, and component inventories.", "Design", ["read_files"]),
  tool("canva-design", "Canva", "Search templates and brand kits.", "Design", ["read_files"]),
  tool("google-analytics", "Google Analytics", "Query GA4 reports and audiences.", "Analytics", ["read_files", "external_web"]),
  tool("amplitude-analytics", "Amplitude", "Query funnels, retention, and segments.", "Analytics", ["read_files", "external_web"]),
  tool("mixpanel-analytics", "Mixpanel", "Query events, cohorts, and reports.", "Analytics", ["read_files", "external_web"]),
  tool("posthog-analytics", "PostHog", "Query product analytics and session replays.", "Analytics", ["read_files", "external_web"]),
  tool("segment-cdp", "Segment", "Read CDP traits and pipe data to destinations.", "Analytics", ["read_files", "external_web"]),

  // ── Data / Storage ───────────────────────────────────────────────────────
  tool("postgres-sql", "Postgres SQL", "Run read-only SQL against a Postgres database.", "Data", ["read_files"], { rating: 4.7 }),
  tool("mysql-sql", "MySQL", "Run read-only queries against MySQL.", "Data", ["read_files"]),
  tool("snowflake", "Snowflake", "Query Snowflake warehouses with role-scoped access.", "Data", ["read_files", "external_web"]),
  tool("bigquery", "BigQuery", "Run BigQuery SQL with cost-bounded queries.", "Data", ["read_files", "external_web"]),
  tool("redshift", "Redshift", "Query Redshift clusters with read access.", "Data", ["read_files", "external_web"]),
  tool("airtable", "Airtable", "Read and write Airtable bases and views.", "Data", ["read_files", "write_files"]),
  tool("google-sheets", "Google Sheets", "Read and update sheet ranges and formulas.", "Data", ["read_files", "write_files"]),
  tool("excel-online", "Excel Online", "Read Microsoft 365 Excel workbooks.", "Data", ["read_files"]),
  tool("supabase-db", "Supabase", "Query Supabase Postgres + storage with RLS.", "Data", ["read_files", "write_files"]),
  tool("planetscale", "PlanetScale", "Run read-only branch-aware queries.", "Data", ["read_files"]),
  tool("mongodb-atlas", "MongoDB Atlas", "Read documents and aggregate pipelines.", "Data", ["read_files"]),
  tool("redis-cache", "Redis", "Inspect keys, queues, and streams (read).", "Data", ["read_files"]),

  // ── AI / ML ──────────────────────────────────────────────────────────────
  tool("openai-chat", "OpenAI Chat", "Call GPT models for completions and tools.", "AI / ML", ["external_web", "run_code"], { rating: 4.9 }),
  tool("anthropic-claude", "Anthropic Claude", "Call Claude models with tool use.", "AI / ML", ["external_web", "run_code"], { rating: 4.9 }),
  tool("google-gemini", "Google Gemini", "Call Gemini models for text and vision.", "AI / ML", ["external_web", "run_code"]),
  tool("mistral-models", "Mistral", "Hosted Mistral models for fast completions.", "AI / ML", ["external_web", "run_code"]),
  tool("groq-inference", "Groq", "Ultra low-latency model inference.", "AI / ML", ["external_web", "run_code"]),
  tool("replicate-models", "Replicate", "Run open-source models with versioning.", "AI / ML", ["external_web", "run_code"]),
  tool("huggingface-inference", "Hugging Face", "Inference API for tens of thousands of models.", "AI / ML", ["external_web", "run_code"]),
  tool("elevenlabs-voice", "ElevenLabs", "High-fidelity text-to-speech voices.", "AI / ML", ["external_web"]),
  tool("deepgram-stt", "Deepgram STT", "Realtime and batch speech-to-text.", "AI / ML", ["external_web", "use_memory"]),
  tool("openai-image", "OpenAI Images", "Generate, edit, and vary images.", "AI / ML", ["external_web"]),
  tool("stability-image", "Stability Image", "Stable Diffusion image generation API.", "AI / ML", ["external_web"]),
  tool("pinecone-vector", "Pinecone Vector", "Upsert, query, and manage vector indexes.", "AI / ML", ["read_files", "write_files", "external_web"]),
  tool("weaviate-vector", "Weaviate Vector", "Hybrid search over vector + keyword.", "AI / ML", ["read_files", "external_web"]),
  tool("chroma-vector", "Chroma Vector", "Local-first embeddings store.", "AI / ML", ["read_files", "write_files"]),

  // ── Web ──────────────────────────────────────────────────────────────────
  tool("browser-fetch", "Browser Fetch", "Fetch a URL and return cleaned text + metadata.", "Web", ["external_web", "use_memory"]),
  tool("playwright-headless", "Playwright Headless", "Drive a headless browser to extract structured data.", "Web", ["external_web", "run_code"], { status: "beta" }),
  tool("firecrawl", "Firecrawl", "Crawl a site and convert pages into LLM-ready Markdown.", "Web", ["external_web"]),
  tool("apify-actors", "Apify Actors", "Run Apify actors for scraping at scale.", "Web", ["external_web", "run_code"]),
  tool("rss-reader", "RSS Reader", "Subscribe and summarize RSS/Atom feeds.", "Web", ["external_web"]),
  tool("ifttt-webhooks", "IFTTT Webhooks", "Trigger IFTTT applets via webhooks.", "Web", ["external_web"]),
  tool("zapier-webhooks", "Zapier Webhooks", "Send and receive Zapier webhooks.", "Web", ["external_web"]),
  tool("make-scenarios", "Make.com", "Trigger Make scenarios from agents.", "Web", ["external_web"]),
  tool("n8n-workflows", "n8n Workflows", "Run self-hosted n8n workflows.", "Web", ["external_web", "run_code"]),

  // ── Security / Misc ──────────────────────────────────────────────────────
  tool("haveibeenpwned", "Have I Been Pwned", "Check breaches for emails and domains.", "Security", ["external_web"]),
  tool("virustotal", "VirusTotal", "Scan URLs and file hashes for known threats.", "Security", ["external_web"]),
  tool("uptime-robot", "UptimeRobot", "Monitor and read uptime checks.", "DevOps", ["external_web"]),
  tool("github-secrets-scan", "Secrets Scanner", "Scan repos for leaked secrets and credentials.", "Security", ["read_code"], { status: "beta" }),
  tool("shodan", "Shodan", "Inspect the internet-facing footprint of an IP/domain.", "Security", ["external_web"]),
  tool("crunchbase", "Crunchbase", "Company data, funding rounds, and people.", "Sales", ["external_web"]),
  tool("producthunt", "Product Hunt", "Daily launches and trending products.", "Marketing", ["external_web"]),
];

/** Convenience helper used by the seed script. */
export function categories(): ToolCategory[] {
  return Array.from(new Set(TOOL_CATALOG.map((t) => t.category))) as ToolCategory[];
}

/** Total count, exported so we can show "100+ MCP tools" in the UI. */
export const TOOL_COUNT = TOOL_CATALOG.length;
