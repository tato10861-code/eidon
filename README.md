# Eidon

**The AI employee company.** Build, deploy and manage production-ready AI employees that
reason, use your tools and finish real work.

[![CI](https://github.com/tato10861-code/eidon/actions/workflows/ci.yml/badge.svg)](https://github.com/tato10861-code/eidon/actions/workflows/ci.yml)
[![CodeQL](https://github.com/tato10861-code/eidon/actions/workflows/codeql.yml/badge.svg)](https://github.com/tato10861-code/eidon/actions/workflows/codeql.yml)
[![Release](https://img.shields.io/github/v/release/tato10861-code/eidon?color=cbff5a)](https://github.com/tato10861-code/eidon/releases)
[![Production deploy](https://img.shields.io/github/deployments/tato10861-code/eidon/production?label=vercel%20prod)](https://eidon-two.vercel.app)
[![Preview deploy](https://img.shields.io/github/deployments/tato10861-code/eidon/preview?label=vercel%20preview)](https://github.com/tato10861-code/eidon/deployments)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel)](https://vercel.com)

> **v0.1.0 — early access.** The platform, the workforce and the runtime are complete.
> Workspace auth, live OAuth tool execution and billing are the next milestones.

**Product model:** B2B SaaS. Multi-tenant workspaces, per-workspace billing and usage,
regional data residency, SSO/SCIM on Enterprise. Free Starter tier, $499/mo Scale,
custom Enterprise.

---

## Why Eidon exists

Every company will hire digital employees. Most tools today sell a chatbot and call it an
agent: a prompt, a text box and a demo that falls apart on the second question.

Eidon is built around a different unit — **the employee**. A complete operating profile:

- a job description and a measurable definition of done;
- domain skills and an execution playbook;
- a scoped toolbelt with least-privilege access;
- long-term memory and retrieval over company knowledge;
- guardrails, approval thresholds and escalation paths;
- an evaluation suite and a quality bar before every shift.

The result is a workforce you can manage like a team — not a prompt you hope behaves.

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

Each profile includes skills, a toolbelt, performance metrics, a system prompt, an
execution playbook, starter tasks and a quality checklist.

## The product

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
| `/api/chat`         | Streaming SSE runtime, rate-limited, provider-agnostic                    |

### Design system

Near-black canvas, acid-lime signal, editorial serif display type, Inter for interface,
JetBrains Mono for machine language, IBM Plex Sans Arabic for RTL. Custom Tailwind v4
tokens, reduced-motion support, keyboard-visible focus, and no UI framework dependency.

## Architecture

```text
Browser · embed · API client
            │
            ▼
┌──────────────────────────────────────────────┐
│ Next.js 16 App Router (RSC + client islands) │
│                                              │
│  /api/chat ──► rate limit ──► Eidon Core     │
│                              ├─ persona      │
│                              ├─ skills       │
│                              ├─ tool router  │
│                              ├─ guardrails   │
│                              └─ provider     │
│                                   ├─ OpenAI-compatible (streaming)
│                                   └─ deterministic demo engine
└──────────────────────────────────────────────┘
```

The runtime is **provider-agnostic**: any OpenAI-compatible endpoint works. With no key,
the deterministic demo engine answers with role-specific, production-shaped deliverables,
so local development, previews and the public demo never break.

### Streaming protocol

`POST /api/chat` returns `text/event-stream`:

```text
data: {"type":"meta","model":"eidon-core · demo","mode":"demo"}
data: {"type":"trace","trace":{"type":"tool","label":"crm.search","detail":"HubSpot · scoped read"}}
data: {"type":"delta","text":"**MEDDIC read**\n\n"}
data: {"type":"done","usage":{"tokens":612,"latencyMs":1840}}
```

The UI renders traces before the first token, then streams the answer with a live caret,
token count and latency.

## Stack

| Layer     | Choice                                                      |
| --------- | ----------------------------------------------------------- |
| Framework | Next.js 16 (App Router, React Server Components)            |
| UI        | React 19, TypeScript 5.9 strict, Tailwind CSS v4            |
| Motion    | CSS keyframes + IntersectionObserver (no animation library) |
| Icons     | Lucide                                                      |
| Runtime   | Node.js 22+, edge-ready SSE                                 |
| AI        | OpenAI-compatible providers + built-in demo engine          |
| CI        | GitHub Actions (typecheck, build, CodeQL)                   |
| Hosting   | Vercel                                                      |

Zero runtime UI dependencies beyond React, Lucide, clsx and tailwind-merge.

## Quickstart

```bash
git clone https://github.com/tato10861-code/eidon.git
cd eidon
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No API key is required. To run a live model, set:

```bash
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

Any OpenAI-compatible provider works — Azure OpenAI, Groq, Together, vLLM, Ollama.

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

## API

List the workforce:

```bash
curl https://eidon.ai/api/employees
```

Talk to an employee:

```bash
curl -N https://eidon.ai/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "ava",
    "messages": [
      { "role": "user", "content": "Write a 4-step outbound sequence for a VP Engineering at a fintech." }
    ]
  }'
```

Embed an employee:

```html
<iframe
  src="https://eidon.ai/embed/ava-sales-development"
  width="420"
  height="640"
  style="border:0;border-radius:24px"
  title="Ava — AI employee"
></iframe>
```

## Real backend (optional, free tier)

Eidon ships with a deterministic demo engine so it runs with zero configuration.
To make it a **real, multi-tenant platform** with persistence and live models, add
free-tier services:

| Capability      | Free option                             | Env vars                                                                                 |
| --------------- | --------------------------------------- | ---------------------------------------------------------------------------------------- |
| Database + auth | [Supabase](https://supabase.com) (free) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| LLM (fast)      | [Groq](https://groq.com) (free tier)    | `OPENAI_BASE_URL=https://api.groq.com/openai/v1`, `OPENAI_MODEL=llama-3.3-70b-versatile` |
| LLM (local)     | [Ollama](https://ollama.com)            | `OPENAI_BASE_URL=http://localhost:11434/v1` (no key)                                     |
| Hosting         | [Vercel](https://vercel.com) (free)     | `NEXT_PUBLIC_SITE_URL`                                                                   |

Apply `supabase/schema.sql` in the Supabase SQL editor to create workspaces,
employees, conversations, messages, tool calls and an append-only audit log.
With no env vars set, the app falls back to demo mode — nothing breaks.

## Deploy to Vercel

1. Import the repository at [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Next.js** (auto-detected).
3. Add environment variables from `.env.example` (all optional).
4. Deploy.

Or from the CLI:

```bash
npx vercel --prod
```

## Project structure

```text
app/
  (site)/            Marketing + product surfaces (shared nav/footer)
  (embed)/           Frameable widget
  api/chat/          Streaming runtime
  api/employees/     Workforce API
  api/health/        Health probe
components/
  chat/              Chat panel, markdown renderer
  marketing/         Landing sections
  playground/        Interactive runtime
  studio/            Six-step builder
  ui/                Button, badge, headings
lib/
  ai/engine.ts       Provider router, prompts, demo composer
  employees.ts       The twelve operating profiles
  tools.ts           50-integration catalog
  i18n/              English + Arabic dictionaries, server locale
messages/            Marketing copy (en, ar)
.github/             CI, release, CodeQL, Dependabot, templates
```

## Quality gates

- `tsc --noEmit` in strict mode on every push.
- Production build on Node 22 in CI.
- CodeQL security-and-quality scan on push and weekly.
- Dependabot for npm and GitHub Actions.
- Secret-free repository: `.env*` ignored, only `.env.example` committed.

## Roadmap

- [ ] Workspaces, auth and role-based access (Supabase).
- [ ] Live OAuth tool execution with per-action approvals.
- [ ] Evaluation studio: scenario suites, regression gates, score history.
- [ ] Voice channel and phone numbers.
- [ ] Marketplace for community-built employees.
- [ ] SOC 2 Type II audit.

## Deployments

Every push to `main` creates a **production** deployment on Vercel and a matching
GitHub Deployment (visible at
[github.com/tato10861-code/eidon/deployments](https://github.com/tato10861-code/eidon/deployments)).
Every pull request creates a **preview** deployment. The badges at the top of this
README reflect the latest production and preview status and update automatically.

Production URL: https://eidon-two.vercel.app

## Production checklist

Before going live with real customers:

- [ ] Set `NEXT_PUBLIC_SITE_URL` to your production domain.
- [ ] Add Supabase or Neon env vars and apply the schema (`supabase/schema.sql` / `neon/schema.sql`).
- [ ] Add an LLM key (`OPENAI_API_KEY` + `OPENAI_BASE_URL`) — Groq free tier works.
- [ ] Configure OAuth client IDs/secrets for the tools you need.
- [ ] Replace illustrative dashboard/testimonial/status data with real data.
- [ ] Run `npm run verify` (typecheck + tests + build) in CI.
- [ ] Enable GitHub Deployments in Vercel (Settings → Git).
- [ ] Resolve GitHub billing so Actions run.
- [ ] Add your domain in Vercel (Settings → Domains).

## Demo content

The dashboard figures, live-activity feed, testimonials and status-page uptime numbers
are **illustrative demo data** shipped with the product so the surfaces render
meaningfully without a backend. They are not claims about real customers or
measured performance. Replace them with your own data before using Eidon in
production.

## License

Proprietary — © 2026 Eidon Labs. See [LICENSE](LICENSE).
