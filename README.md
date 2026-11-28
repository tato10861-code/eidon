# Eidon

**The AI employee company.** Build, deploy and manage production-ready AI teammates that
reason, use your tools and finish real work.

<!-- CI & security -->

[![CI](https://github.com/tato10861-code/eidon/actions/workflows/ci.yml/badge.svg)](https://github.com/tato10861-code/eidon/actions/workflows/ci.yml)
[![Deploy](https://github.com/tato10861-code/eidon/actions/workflows/deploy.yml/badge.svg)](https://github.com/tato10861-code/eidon/actions/workflows/deploy.yml)
[![CodeQL](https://github.com/tato10861-code/eidon/actions/workflows/codeql.yml/badge.svg)](https://github.com/tato10861-code/eidon/actions/workflows/codeql.yml)
[![SDK](https://github.com/tato10861-code/eidon/actions/workflows/sdk.yml/badge.svg)](https://github.com/tato10861-code/eidon/actions/workflows/sdk.yml)

<!-- activity & size -->

[![Commits](https://img.shields.io/github/commit-activity/m/tato10861-code/eidon?label=commits%2Fmonth&color=cbff5a)](https://github.com/tato10861-code/eidon/commits/main)
[![Last commit](https://img.shields.io/github/last-commit/tato10861-code/eidon/main?color=cbff5a)](https://github.com/tato10861-code/eidon/commits/main)
[![PRs merged](https://img.shields.io/github/issues-pr-closed/tato10861-code/eidon?label=PRs%20merged&color=cbff5a)](https://github.com/tato10861-code/eidon/pulls?q=is%3Apr+is%3Aclosed)
[![Code size](https://img.shields.io/github/languages/code-size/tato10861-code/eidon)](https://github.com/tato10861-code/eidon)
[![Repo size](https://img.shields.io/github/repo-size/tato10861-code/eidon)](https://github.com/tato10861-code/eidon)

<!-- release & deploy -->

[![Release](https://img.shields.io/github/v/release/tato10861-code/eidon?color=cbff5a&logo=github)](https://github.com/tato10861-code/eidon/releases)
[![Production](https://img.shields.io/github/deployments/tato10861-code/eidon/production?label=vercel%20prod)](https://eidon-two.vercel.app)
[![Docker](https://img.shields.io/badge/Docker-ghcr.io-2496ed?logo=docker)](https://github.com/tato10861-code/eidon/pkgs/container/eidon)

<!-- SDKs -->

[![npm](https://img.shields.io/npm/v/eidon?label=npm%20sdk&color=cb3837&logo=npm)](https://www.npmjs.com/package/eidon)
[![PyPI](https://img.shields.io/pypi/v/eidon?label=pypi%20sdk&color=3775a9&logo=python)](https://pypi.org/project/eidon/)
[![npm CLI](https://img.shields.io/npm/v/@eidon/cli?label=npm%20cli&color=cb3837&logo=npm)](https://www.npmjs.com/package/@eidon/cli)

<!-- stack -->

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1-6ba539?logo=openapiinitiative)](openapi.yaml)
[![License](https://img.shields.io/github/license/tato10861-code/eidon)](LICENSE)

> **v0.3.0** — Full enterprise platform: SCIM/SSO, RBAC, fine-tuning, evals, analytics,
> knowledge base, integrations (Slack/Teams/Jira/+8), GDPR export, budget controls,
> conversation memory, audit log, multi-model routing, and controlled CI/CD.

**Product model:** B2B SaaS · Multi-tenant · Per-workspace billing · Regional data residency ·
SSO/SCIM on Enterprise · Free Starter / $499/mo Scale / custom Enterprise.

---

## Why Eidon exists

Every company will hire digital employees. Most tools today sell a chatbot and call it an
agent: a prompt, a text box and a demo that falls apart on the second question.

Eidon is built around a different unit — **the employee**. A complete operating profile:

- a job description and a measurable definition of done
- domain skills and an execution playbook
- a scoped toolbelt with least-privilege access
- long-term memory and retrieval over company knowledge
- guardrails, approval thresholds and escalation paths
- an evaluation suite and a quality bar before every shift

The result is a workforce you can manage like a team — not a prompt you hope behaves.

---

## Enterprise platform features

The following enterprise capabilities are fully implemented in this release:

| Category           | Feature                                                                                         | Endpoint                                    |
| ------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Identity**       | SAML 2.0 SSO                                                                                    | `POST /api/sso/saml`                        |
| **Provisioning**   | SCIM 2.0 (users + groups)                                                                       | `/api/scim/v2/Users`, `/api/scim/v2/Groups` |
| **Access control** | RBAC — 4 roles, 24 permissions                                                                  | Enforced across all APIs                    |
| **Security**       | IP allowlisting + audit log                                                                     | `GET /api/audit/export`                     |
| **Cost control**   | Per-workspace/employee/member budgets                                                           | `POST /api/workspaces/budgets`              |
| **Notifications**  | 4 channels, 6 categories, digest scheduling                                                     | `PATCH /api/notifications`                  |
| **Integrations**   | Slack, Teams, Jira, GitHub, Zendesk, PagerDuty, Linear, Salesforce, HubSpot, Intercom, webhooks | `POST /api/integrations`                    |
| **Knowledge**      | RAG document management (upload, version, search)                                               | `POST /api/knowledge-base`                  |
| **Memory**         | Per-conversation persistent memory + confidence scoring                                         | `POST /api/conversations/memory`            |
| **Evals**          | Evaluation suites, run scoring, regression gates                                                | `POST /api/evals`                           |
| **Fine-tuning**    | Job lifecycle management with hyperparameter control                                            | `POST /api/fine-tuning`                     |
| **Analytics**      | Usage, cost, model distribution, top employees                                                  | `GET /api/analytics`                        |
| **Feature flags**  | Per-workspace JSONB-stored feature gates                                                        | `PATCH /api/workspaces/flags`               |
| **Rate limiting**  | Dual: in-memory sliding window + Neon tier-aware                                                | Built into `/api/chat`                      |
| **Webhooks**       | HMAC-SHA256 signed, 18 event types, 3-attempt retry                                             | `POST /api/workspaces/webhooks`             |
| **SDK**            | TypeScript client with 9 sub-APIs                                                               | `lib/sdk.ts`                                |
| **Data export**    | GDPR/CCPA portability export, full workspace data                                               | `POST /api/data-export`                     |
| **Multi-model**    | 5-step priority resolution, 14 models, plan-aware                                               | `lib/model-routing.ts`                      |
| **Health**         | Liveness + deep health check                                                                    | `GET /api/health`                           |
| **OpenAPI**        | Full 3.1 spec auto-generated                                                                    | `GET /api/openapi`                          |
| **IaC**            | Terraform provider schema                                                                       | `terraform/eidon-provider.tf.json`          |
| **Provisioning**   | Single-call workspace bootstrap                                                                 | `POST /api/workspaces/provision`            |

---

## The workforce

Twelve specialists ship out of the box, across every department a company actually runs.

| Employee   | Role                  | Department  | Signature outcome                     |
| ---------- | --------------------- | ----------- | ------------------------------------- |
| **Ava**    | Sales Development Rep | Revenue     | Cold lists → booked meetings          |
| **Atlas**  | Data Analyst          | Data        | Questions → validated answers         |
| **Mira**   | Customer Support      | Support     | Tickets → resolutions, 78% autonomous |
| **Rex**    | Technical Recruiter   | Talent      | Hundreds screened → five worth hiring |
| **Nova**   | Growth Marketer       | Marketing   | Positioning → qualified pipeline      |
| **Ledger** | Finance Analyst       | Finance     | Books → board-ready narrative         |
| **Iris**   | Contract Counsel      | Legal       | Fine print → ranked exposure          |
| **Orion**  | Operations Manager    | Operations  | Chaos → runbooks with owners          |
| **Vera**   | Product Manager       | Product     | Messy signal → shippable spec         |
| **Kai**    | Software Engineer     | Engineering | Bug report → verified fix             |
| **Sage**   | Executive Assistant   | Executive   | Inbox → three decisions               |
| **Noor**   | Customer Success      | Success     | Onboarding → expansion                |

---

## Product surfaces

| Surface             | What it does                                                              |
| ------------------- | ------------------------------------------------------------------------- |
| `/`                 | Marketing site, live employee demo, pricing, FAQ — English + Arabic (RTL) |
| `/employees`        | Filterable workforce gallery                                              |
| `/employees/[slug]` | Full employee profile, toolbelt, quality bar, embed + API                 |
| `/studio`           | Six-step builder: identity, mind, tools, knowledge, guardrails, deploy    |
| `/playground`       | Streaming chat with tool traces, latency and token usage                  |
| `/dashboard`        | Workforce analytics, quality scores, activity, deployments                |
| `/integrations`     | 50 native integrations with search and category filters                   |
| `/docs`             | Quickstart, API reference, embed guide, architecture                      |
| `/embed/[slug]`     | Minimal, frameable chat widget                                            |

---

## Architecture

```text
Browser · embed · API client · SDK (TS / Python / Go)
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│  Next.js 16 App Router  (RSC + client islands, Turbopack)    │
│                                                              │
│  /api/chat ──► rate-limit ──► model-routing ──► Eidon Core   │
│                               (5-step priority chain)        │
│                              ├─ persona + skills             │
│                              ├─ tool router (50 integrations)│
│                              ├─ RAG (knowledge-base)         │
│                              ├─ memory (confidence-scored)   │
│                              ├─ guardrails + budget check    │
│                              └─ provider (14 models)         │
│                                                              │
│  Neon (Postgres)                                             │
│  ├─ workspaces / members / employees / conversations         │
│  ├─ SCIM · RBAC · SSO · IP allowlist · audit log            │
│  ├─ webhooks · rate_limit_log · feature_flags · settings     │
│  ├─ evals · fine_tuning_jobs · conversation_memory           │
│  ├─ notification_preferences · workspace_budgets             │
│  ├─ workspace_integrations · knowledge_documents             │
│  └─ data_export_jobs                                         │
└──────────────────────────────────────────────────────────────┘
```

**Provider-agnostic runtime:** any OpenAI-compatible endpoint works.
With no key the deterministic demo engine answers with role-specific, production-shaped
deliverables so local development, previews and the public demo never break.

### Multi-model routing

Five-step priority chain in `lib/model-routing.ts`:

1. Conversation override (per-message `model` param)
2. Employee pin (each AI employee can lock to a model)
3. Workspace default (admin-configurable)
4. Plan default (free/starter → Haiku; pro/enterprise → Sonnet)
5. Global env fallback (`OPENAI_MODEL`)

14 models across Anthropic, OpenRouter, Google, Mistral, Cohere, xAI, OpenAI.

### Streaming protocol

`POST /api/chat` returns `text/event-stream`:

```
data: {"type":"meta","model":"claude-sonnet-4-6","mode":"live"}
data: {"type":"trace","trace":{"type":"tool","label":"crm.search","detail":"HubSpot"}}
data: {"type":"delta","text":"**MEDDIC read**\n\n"}
data: {"type":"done","usage":{"tokens":612,"latencyMs":1840}}
```

---

## Database schema (6 migrations)

| Migration                                 | Tables added                                                                                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `001_base.sql`                            | workspaces, members, employees, conversations, messages, tool_calls, audit_log                                                                               |
| `002_enterprise.sql`                      | scim_tokens, roles, permissions, ip_allowlist, webhooks, webhook_deliveries, rate_limit_log, workspace_settings, employee_templates                          |
| `003_evals.sql`                           | eval_suites, eval_runs                                                                                                                                       |
| `004_memory_finetuning_notifications.sql` | fine_tuning_jobs, notification_preferences, notifications, conversation_memory                                                                               |
| `005_budgets.sql`                         | workspace_budgets; extends audit_log (ip_address, user_agent)                                                                                                |
| `006_integrations_knowledge_export.sql`   | workspace_integrations, knowledge_documents, data_export_jobs; full-text search indexes; extends conversations (message_count, total_tokens, total_cost_usd) |

---

## API surface (v1)

| Method            | Path                        | Purpose                                       |
| ----------------- | --------------------------- | --------------------------------------------- |
| `GET/POST`        | `/api/chat`                 | Streaming AI employee chat (SSE)              |
| `GET`             | `/api/employees`            | Workforce listing                             |
| `GET/POST/DELETE` | `/api/workspaces/provision` | Single-call workspace bootstrap               |
| `GET/PATCH`       | `/api/workspaces/settings`  | Workspace configuration                       |
| `GET/POST/DELETE` | `/api/workspaces/budgets`   | Spending budgets and cost controls            |
| `GET/PATCH`       | `/api/workspaces/flags`     | Feature flags                                 |
| `GET/POST/DELETE` | `/api/workspaces/webhooks`  | Webhook management                            |
| `GET/POST/DELETE` | `/api/employees/templates`  | Employee template library                     |
| `GET/POST/DELETE` | `/api/conversations/memory` | Persistent conversation memory                |
| `GET/POST/DELETE` | `/api/integrations`         | Third-party integration connectors            |
| `GET/POST/DELETE` | `/api/knowledge-base`       | RAG document management                       |
| `GET/POST/DELETE` | `/api/fine-tuning`          | Fine-tuning job lifecycle                     |
| `GET/PATCH/POST`  | `/api/notifications`        | Notification preferences + send               |
| `GET`             | `/api/analytics`            | Usage, cost and quality analytics             |
| `GET`             | `/api/audit/export`         | GDPR-compliant audit log export (JSON/NDJSON) |
| `GET/POST`        | `/api/data-export`          | Full workspace data portability export        |
| `GET/POST/DELETE` | `/api/evals`                | Evaluation suites and scoring                 |
| `GET`             | `/api/health`               | Liveness + deep health check                  |
| `GET`             | `/api/openapi`              | OpenAPI 3.1 specification                     |
| `/api/scim/v2/*`  | SCIM 2.0                    | RFC-7643/7644 user/group provisioning         |
| `POST`            | `/api/sso/saml`             | SAML 2.0 SSO assertion consumer               |

---

## CI/CD and deployment

Deployment is **controlled** — Vercel's GitHub auto-integration is disabled to prevent
exhausting the free-tier 100 deployments/day limit. GitHub Actions manages the pipeline:

| Trigger               | Action                          | Environment |
| --------------------- | ------------------------------- | ----------- |
| Push to `main`        | `vercel deploy --prod`          | Production  |
| Pull request → `main` | `vercel deploy` (once per push) | Preview     |
| Other branches        | No deploy                       | —           |

Each PR gets a preview URL posted as a comment, updated on every push.

**Required GitHub secrets:**

```
VERCEL_TOKEN       # personal access token from vercel.com/account/tokens
VERCEL_ORG_ID      # from .vercel/project.json after `vercel link`
VERCEL_PROJECT_ID  # from .vercel/project.json after `vercel link`
```

---

## Stack

| Layer     | Choice                                                              |
| --------- | ------------------------------------------------------------------- |
| Framework | Next.js 16 (App Router, React Server Components, Turbopack)         |
| UI        | React 19, TypeScript 5.9 strict, Tailwind CSS v4                    |
| Database  | Neon (serverless Postgres) — 6 migrations, 24+ tables               |
| AI        | 14 models via OpenAI-compatible endpoints + built-in demo engine    |
| Auth      | SAML 2.0 SSO, SCIM 2.0, RBAC (4 roles, 24 permissions)              |
| Security  | HMAC-SHA256 webhooks, IP allowlist, audit log, rate limiting        |
| CI        | GitHub Actions (typecheck, build, CodeQL, controlled Vercel deploy) |
| Hosting   | Vercel (Node.js 22, Fluid Compute)                                  |
| IaC       | Terraform provider schema                                           |
| SDK       | TypeScript (`lib/sdk.ts`), Python and Go packages planned           |

---

## Quickstart

```bash
git clone https://github.com/tato10861-code/eidon.git
cd eidon
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No API key required for demo mode. For a live model:

```bash
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

Any OpenAI-compatible provider works — Anthropic, Azure OpenAI, Groq, Together, Ollama.

## Scripts

| Command                 | Purpose                              |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Start the development server         |
| `npm run build`         | Production build                     |
| `npm start`             | Serve the production build           |
| `npm run typecheck`     | Strict TypeScript check              |
| `npm test`              | Run the Vitest suite                 |
| `npm run test:coverage` | Tests with coverage report           |
| `npm run format`        | Format the codebase with Prettier    |
| `npm run format:check`  | Verify formatting                    |
| `npm run verify`        | Typecheck + tests + production build |

---

## Project structure

```text
app/
  (site)/                     Marketing + product surfaces
  (embed)/                    Frameable widget
  api/
    chat/                     Streaming SSE runtime
    employees/                Workforce API
    health/                   Liveness + deep health check
    openapi/                  OpenAPI 3.1 spec
    analytics/                Usage and cost analytics
    evals/                    Evaluation suites
    fine-tuning/              Fine-tuning job management
    notifications/            Notification preferences
    conversations/memory/     Persistent conversation memory
    integrations/             Slack/Teams/Jira/+8 integrations
    knowledge-base/           RAG document management
    data-export/              GDPR data portability export
    audit/export/             Audit log export (JSON/NDJSON)
    scim/                     SCIM 2.0 provisioning
    sso/                      SAML 2.0 SSO
    workspaces/
      provision/              Single-call workspace bootstrap
      settings/               Workspace configuration
      budgets/                Spending budgets and cost controls
      flags/                  Feature flags
      webhooks/               Webhook management
components/
  chat/                       Chat panel, markdown renderer
  marketing/                  Landing sections
  playground/                 Interactive runtime
  studio/                     Six-step employee builder
  ui/                         Button, badge, headings
lib/
  sdk.ts                      EidonClient TypeScript SDK
  model-routing.ts            Multi-model routing (5-step chain)
  rate-limit.ts               Dual rate limiting
  webhooks.ts                 HMAC-SHA256 webhook delivery
  feature-flags.ts            Per-workspace feature gates
  neon.ts                     Neon serverless client
  evals/runner.ts             Evaluation framework
neon/migrations/              6 SQL migrations, 24+ tables
terraform/                    Terraform provider schema
.github/
  workflows/
    ci.yml                    Typecheck + build + CodeQL
    deploy.yml                Controlled Vercel deployment
    sdk.yml                   SDK type checks
    codeql.yml                Security and quality scan
```

---

## Quality gates

- `tsc --noEmit` strict mode on every push
- Production build (Node 22) in CI
- CodeQL security scan on push + weekly schedule
- Dependabot for npm and GitHub Actions
- Commitlint (`subject-case: lower-case`) enforced via husky
- Prettier auto-format on every write
- Controlled deployments: main only → Vercel production

---

## Roadmap

### Shipped ✓

- [x] 12 AI employees across all departments
- [x] Streaming chat runtime (SSE), tool trace rendering
- [x] SCIM 2.0 (RFC 7643/7644) user and group provisioning
- [x] SAML 2.0 SSO assertion consumer
- [x] RBAC — 4 roles, 24 permissions
- [x] IP allowlisting + audit log
- [x] Multi-model routing (14 models, 5-step chain)
- [x] Evaluation suites with 4 scorer types
- [x] Fine-tuning job lifecycle management
- [x] Persistent conversation memory (confidence-scored)
- [x] Per-workspace notification preferences (4 channels)
- [x] Workspace / employee / member spending budgets
- [x] GDPR/CCPA data portability export
- [x] Third-party integrations (Slack, Teams, Jira, GitHub, Zendesk, PagerDuty, Linear, Salesforce, HubSpot, Intercom, webhooks)
- [x] Knowledge base for RAG document management
- [x] HMAC-SHA256 webhooks (18 event types, 3-attempt retry)
- [x] Dual rate limiting (in-memory + Neon tier-aware)
- [x] Feature flags (per-workspace JSONB-stored)
- [x] TypeScript SDK with 9 sub-APIs
- [x] OpenAPI 3.1 specification
- [x] Terraform provider schema
- [x] Controlled CI/CD (GitHub Actions → Vercel CLI)
- [x] Analytics (usage, cost, model distribution)
- [x] Single-call workspace bootstrap
- [x] Deep health endpoint

### Upcoming

- [ ] Live OAuth tool execution with per-action approvals
- [ ] Voice channel and phone numbers
- [ ] Marketplace for community-built employees
- [ ] SOC 2 Type II audit
- [ ] Python and Go SDKs (TypeScript ships)
- [ ] Real-time vector search (pgvector for knowledge-base)
- [ ] Multi-region data residency selection

---

## Production checklist

Before going live with real customers:

- [ ] Set `NEXT_PUBLIC_SITE_URL` to your production domain
- [ ] Add Neon env vars and apply all 6 migrations (`neon/migrations/`)
- [ ] Add `ANTHROPIC_API_KEY` or any OpenAI-compatible key
- [ ] Set `ADMIN_API_KEY` for admin API authentication
- [ ] Configure `SAML_*` env vars for SSO
- [ ] Add GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- [ ] Run `vercel link` to generate `.vercel/project.json`
- [ ] Run `npm run verify` (typecheck + tests + build) locally
- [ ] Add your domain in Vercel (Settings → Domains)

---

## Demo content

Dashboard figures, live-activity feed, testimonials and status-page uptime numbers are
**illustrative demo data** shipped so surfaces render meaningfully without a backend.
They are not claims about real customers or measured performance. Replace before production.

---

## License

Proprietary — © 2026 Eidon Labs. See [LICENSE](LICENSE).
