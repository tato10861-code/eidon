# Contributing to Eidon

Eidon is built like a product, not a demo. Contributions should leave the runtime,
the design system and the documentation better than they found them.

## Setup

```bash
git clone https://github.com/tato10861-code/eidon.git
cd eidon
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. No API key is required: the deterministic demo engine
powers every conversation until you add `OPENAI_API_KEY`.

## Quality gates

Every pull request must pass all four CI jobs:

```bash
npm run lint        # ESLint 10 flat config — zero errors required
npm run typecheck   # tsc --noEmit
npm run test        # vitest with coverage
npm run build       # production Next.js build
```

Husky enforces lint-staged (ESLint + Prettier) on every `git commit`, and
Commitlint validates commit messages against Conventional Commits before the
commit is recorded. CI runs the same commands on Node 22, and CodeQL scans
every push to `main`.

Conventional Commit types in use:

| Type       | Use when                                     |
| ---------- | -------------------------------------------- |
| `feat`     | New feature or capability                    |
| `fix`      | Bug fix                                      |
| `docs`     | Documentation only                           |
| `chore`    | Build, tooling, dependency or config changes |
| `refactor` | Code change that is neither a fix nor a feat |
| `test`     | Adding or updating tests                     |
| `perf`     | Performance improvement                      |
| `ci`       | CI/CD workflow changes                       |

## Conventions

- **Language:** English for code, comments, commits, issues and documentation.
- **TypeScript:** strict mode, no `any` unless justified in a comment.
- **Components:** server components by default; add `"use client"` only for state,
  effects or browser APIs.
- **Styling:** Tailwind utilities plus the tokens in `app/globals.css`. No inline
  colours that bypass the theme.
- **Accessibility:** keyboard navigable, visible focus, labelled controls, reduced
  motion respected.
- **Commits:** imperative mood, scoped when useful, for example
  `feat(runtime): stream tool traces before the first token`.
- **Branches:** `feat/…`, `fix/…`, `docs/…`, `chore/…`.

## Adding an AI employee

1. Add a complete profile to `lib/employees.ts`: role, skills, toolbelt, metrics,
   system prompt, starters, playbook and Arabic marketing copy.
2. Add a delivery template in `lib/ai/engine.ts` if the role needs a specialised
   offline demo response.
3. Verify the profile renders at `/employees/<slug>` and in the studio.
4. Add the role to the Arabic department map if it introduces a new department.

## Adding an integration

Add the tool to `lib/tools.ts` with its category, description, scopes and status.
Then reference it from the relevant employee toolbelt. Real OAuth credentials belong
in environment variables, never in the repository.

## Pull requests

Use the template. Include a screenshot for visual changes and a short note on the
trade-off you made. Small, focused PRs are reviewed faster than large ones.

## Security

Never include secrets, customer data or private URLs in an issue, commit or screenshot.
Follow [SECURITY.md](SECURITY.md) for vulnerability reports.
