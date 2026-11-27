# Changelog

All notable changes to Eidon are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

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
