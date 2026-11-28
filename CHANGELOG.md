# Changelog

All notable changes to Eidon are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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
