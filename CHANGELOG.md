# Changelog

All notable changes to Eidon are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added — Enterprise billing

- **Stripe billing integration** (`lib/billing.ts`): `createCheckoutSession`,
  `createPortalSession`, `getOrCreateCustomer`, `cancelSubscription`,
  `constructWebhookEvent` — lazy-loads Stripe to minimise cold start overhead
- **Billing API routes**:
  - `POST /api/billing/checkout` — creates a Stripe Checkout Session for
    subscription upgrades; persists Stripe customer ID on the workspace row
  - `POST /api/billing/portal` — opens the Stripe Customer Portal for
    self-service billing management
  - `POST /api/billing/webhook` — receives Stripe events (`checkout.session.completed`,
    `customer.subscription.updated`, `customer.subscription.deleted`,
    `invoice.payment_failed`); updates workspace plan and writes audit entries
- **Database migration** (`neon/migrations/001_billing.sql`): adds
  `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`,
  `billing_period_end`, `seats`, `updated_at` to `workspaces`; new `subscriptions`
  and `invoices` tables with covering indexes
- **Vercel Web Analytics** (`@vercel/analytics` v2.0.1): page-view and Web Vitals
  tracking enabled in the Vercel dashboard with zero configuration beyond mounting
  `<Analytics />` in the root layout

### Added — Admin & observability

- **Admin API** (`/api/admin/stats`, `/api/admin/workspaces`): protected by
  `x-admin-key` header matching `ADMIN_API_KEY`; returns runtime stats, memory,
  workspace counts by plan, and paginated workspace listing
- **Audit log API** (`GET /api/audit`, `POST /api/audit`): retrieves and writes
  workspace-scoped audit events with pagination and optional `action` filter

### Added — API documentation

- **Interactive API reference** at `/docs/api` using RapiDoc 9.3.4; themed to the
  Eidon dark palette; loads the existing `/openapi.yaml` spec with authentication
  support and live request execution

### Added — Test coverage

- `tests/billing.test.ts` — 5 unit tests for Stripe helpers via Vitest mocking
- `tests/webhooks.test.ts` — 6 unit tests for HMAC signature verification
- `tests/audit.test.ts` — 4 integration tests for the audit log API (offline mode)
- `tests/admin.test.ts` — 5 integration tests for admin API auth and responses

### Added — Configuration

- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRICE_SCALE_MONTHLY`, `STRIPE_PRICE_SCALE_ANNUAL`, `ADMIN_API_KEY`
  documented in `.env.example`

---

## [0.2.0] — 2026-11-27

### Added — AI engine

- **Multi-provider AI engine** with automatic priority fallback:
  Anthropic Claude → OpenRouter → Google Gemini → Mistral → Cohere → xAI Grok → AI71 → OpenAI → demo
- Alias key support: `OPENROUTERAI_API_KEY`/`OPENROUTER_API_KEY`,
  `GMINI_API_KEY`/`GEMINI_API_KEY`/`GOOGLE_API_KEY`
- Anthropic Claude integration with Neon serverless Postgres message persistence
- OpenRouter passthrough for 200+ models via a single API key

### Added — SDKs

- **Node.js / TypeScript SDK** (`eidon` npm package v0.2.0)
  - `EidonClient` with `stream()` async generator (SSE), `chat()`, `listEmployees()`
  - Full TypeScript types: `ChatMessage`, `Employee`, `ChatResponse`, `StreamChunk`
  - CJS + ESM + `.d.ts` dual build via `tsup`
  - `package-lock.json` for reproducible installs
- **Python SDK** (`eidon` PyPI package v0.2.0)
  - `Eidon` (sync) + `AsyncEidon` (async) clients using `httpx`
  - `stream()` generator, `chat()`, `list_employees()`
  - Hatch-based build, mypy-typed
- **Go SDK** (`github.com/tato10861-code/eidon/sdk/go` v0.2.0)
  - `Client` with functional options (`WithBaseURL`, `WithTimeout`)
  - Callback-based `Stream()` with `bufio.Scanner` SSE parsing
  - `Chat()`, `ListEmployees()`

### Added — API & integrations

- **OpenAPI 3.1 specification** (`openapi.yaml`) covering all 9 endpoint groups
- **Webhooks system**: HMAC-SHA256 signed delivery (`X-Eidon-Signature: sha256=…`),
  5 event types: `conversation.created`, `message.created`, `chat.completed`,
  `key.created`, `key.revoked`
- Webhook CRUD API (`GET/POST /api/webhooks`, `DELETE/PATCH /api/webhooks/:id`)
- `lib/webhooks.ts`: `dispatchWebhook<T>()` with `Promise.allSettled`, 10 s timeout
  per delivery; `verifyWebhookSignature()` for inbound verification
- Neon serverless Postgres schema: `webhooks` and `webhook_deliveries` tables with
  indexes

### Added — Platform features

- Enterprise API keys (`/api/keys`): scoped, revocable, hashed storage
- Usage analytics (`/api/usage`): per-workspace token and latency aggregates
- Multi-tenant workspace model with per-workspace isolation
- Training pipeline: fine-tuning job management and dataset ingestion endpoints

### Added — CLI

- **`@eidon/cli`** (npm package, binary `eidon` v0.2.0)
  - Commands: `health`, `employees`, `chat <message>`, `usage`,
    `webhooks list`, `webhooks create`
  - Config via `~/.eidon/config.json` or `EIDON_API_KEY` / `EIDON_BASE_URL` env vars
  - URL validation on base URL and webhook target (CodeQL-safe)

### Added — Infrastructure

- **Helm chart** (`deploy/helm/eidon`): `replicaCount: 2`, HPA (CPU 70 % / memory 80 %),
  pod anti-affinity, non-root security context, `eidon-secrets` secret ref
- **Multi-arch Docker CI** (`.github/workflows/docker.yml`): GHCR
  `ghcr.io/tato10861-code/eidon` for `linux/amd64` and `linux/arm64`
- **SDK CI** (`.github/workflows/sdk.yml`): Node.js vitest + tsc, Python hatch test,
  Go test + vet
- `docker-compose.yml`: all 9 provider env vars wired; `DOCKER_BUILD=1` build arg

### Changed

- `CHANGELOG.md`: updated with all v0.2.0 additions
- `.gitignore`: `**/node_modules` to cover nested SDK node_modules
- `.prettierignore`: added `deploy/helm` (Helm go-template syntax is not valid YAML)
- `tsconfig.json`: excluded `cli`, `sdk/node`, `sdk/go` from root TypeScript check

### Added — Developer experience

- Professional ESLint 10 flat config (`eslint.config.mjs`) with Next.js core-web-vitals,
  TypeScript, and Prettier integration
- Husky v9 pre-commit hooks enforcing lint-staged (ESLint + Prettier) on staged files
- Commitlint with Conventional Commits (`@commitlint/config-conventional`) enforced on
  every commit message
- GitHub Actions: parallel CI jobs — `lint`, `typecheck`, `test`, `build`
- GitHub Actions: `dependency-review` blocking high-severity vulnerabilities and
  GPL-licensed dependencies
- GitHub Actions: `labeler` for automatic PR labelling by changed paths
- GitHub Actions: `stale` bot closing abandoned issues and PRs
- Vercel `vercel.json`: clean URLs, auto job cancellation, PR deployment comments
- `.editorconfig`, `.node-version`, `.nvmrc` for consistent developer environment
- `CODE_OF_CONDUCT.md` based on Contributor Covenant 2.1
- Security vulnerability issue template for private disclosure workflow
- Deploy workflow updated to record GitHub deployments for every branch and PR

---

## [0.1.0] — 2024-01-01

### Added

- Initial public release of the Eidon platform
- Twelve built-in AI employees: Ava, Atlas, Mira, Rex, Nova, Ledger, Iris, Orion,
  Vera, Kai, Sage, Noor
- Multi-tenant workspace model with per-workspace isolation
- AI runtime with deterministic demo engine (no API key required for local dev)
- Next.js 16 App Router with server components and streaming
- Tailwind CSS design system with dark-mode support and reduced-motion respect
- Full internationalisation: English and Arabic with RTL layout
- Marketing site: Hero, How It Works, Features, Integrations, Security, Testimonials,
  Pricing, FAQ, Final CTA sections
- Employee profiles, studio, playground, dashboard, and voice interface pages
- Supabase and Neon database adapters — demo mode when neither is configured
- OpenGraph images, sitemap, robots.txt, and web manifest
- CodeQL code-scanning on every push
- Dependabot for npm and GitHub Actions, grouped by package family

[Unreleased]: https://github.com/tato10861-code/eidon/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/tato10861-code/eidon/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tato10861-code/eidon/releases/tag/v0.1.0
