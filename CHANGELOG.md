# Changelog

All notable changes to Eidon are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0](https://github.com/tato10861-code/eidon/compare/v0.1.0...v0.2.0) (2026-11-27)


### Features

* add eval studio page and sitemap entry ([e8e777f](https://github.com/tato10861-code/eidon/commit/e8e777fade9075bab47edee157a31cdba191bafa))
* add login, marketplace, voice pages; footer links; sitemap ([7b2b0ff](https://github.com/tato10861-code/eidon/commit/7b2b0fff4431c53382ddcc71f9bf68e8465aa090))
* add Neon (serverless Postgres) support alongside Supabase; schema + routes ([78a6124](https://github.com/tato10861-code/eidon/commit/78a6124879247aac4e6a44a8f39b411da8761e85))
* add optional Supabase backend, workspaces/conversations APIs, free-tier providers, schema ([97142e7](https://github.com/tato10861-code/eidon/commit/97142e7b6b75604d1e6b914f683ee12dc1d8e467))
* add workspaces page; position as B2B SaaS in README ([3d3d0dc](https://github.com/tato10861-code/eidon/commit/3d3d0dcc8ae1606f1949949f29876ca7189d577f))
* **ai:** Anthropic Claude support, Neon message persistence, messages API ([61cb84d](https://github.com/tato10861-code/eidon/commit/61cb84d0292b8daa5b1bb3c620a60adc5d9868fc))
* **ai:** multi-provider engine — openrouter, gemini, cohere, xai, ai71 ([7c7fcc5](https://github.com/tato10861-code/eidon/commit/7c7fcc5873e115dc71cce18d7fd55b37b285a28e))
* enterprise licensing, api keys, usage analytics, data export ([63bbb4c](https://github.com/tato10861-code/eidon/commit/63bbb4c2d0c9975f5350b4264d3fefe52f5bf531))
* **phase2:** live OAuth providers, approval-gated tool execution, connected tools page ([9c5f04e](https://github.com/tato10861-code/eidon/commit/9c5f04ec37939542d1e296ba3fdbdcb4e7b39cab))

## [Unreleased]

### Added

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
- `CHANGELOG.md` (this file) tracking all notable project changes
- Security vulnerability issue template for private disclosure workflow
- Deploy workflow updated to record GitHub deployments for every branch and PR

### Changed

- `vitest.config.mts`: replaced deprecated `__dirname` with `import.meta.dirname`
- `package.json`: upgraded `engines.node` to `>=22.0.0`; added `lint`, `lint:fix`,
  and `prepare` scripts

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

[Unreleased]: https://github.com/tato10861-code/eidon/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/tato10861-code/eidon/releases/tag/v0.1.0
