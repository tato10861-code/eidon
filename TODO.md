# Eidon commercialization outcomes

## P0 — Enforce verified identity and workspace authorization

- Every protected API route rejects anonymous requests in production mode.
- Browser sessions are verified server-side rather than trusting the presence of a cookie.
- API keys are accepted only through a centralized verifier, must be active and unexpired, and must carry the required scope.
- A request cannot select or access a workspace unless its authenticated user or API key belongs to that workspace.
- Demo mode is explicit and cannot be enabled accidentally when production data services are configured.

## P0 — Make tenant isolation enforceable

- Supabase policies resolve workspace membership from authenticated claims and do not use `using (true)` or `with check (true)` for customer tables.
- Neon access paths require a verified workspace context and never use a client-supplied workspace ID as authorization.
- Cross-tenant read, write, export, key, webhook, and tool-execution regression tests pass.

## P1 — Build durable commercial primitives

- Usage events are durable, idempotent, attributable to a workspace, and queryable by billing period.
- Plan entitlements and hard/soft limits are enforced before expensive model or tool execution.
- Billing-provider events have signature verification, idempotency, and subscription-state reconciliation.
- Audit records identify actor, workspace, action, target, timestamp, and outcome without storing unnecessary secrets.

## P1 — Secure integrations and outbound actions

- OAuth uses state and PKCE, validates callbacks, exchanges codes server-side, encrypts tokens, and scopes credentials per workspace.
- Human approvals are server-issued, single-use or expiry-bound, actor-bound, and audited.
- Webhooks reject private/loopback/link-local/cloud-metadata targets, sign deliveries, prevent replay, and record retry outcomes.

## P1 — Commercial trust package

- License metadata and documentation agree on one authoritative commercial model.
- Security, privacy, DPA, subprocessors, data deletion, support/SLA, and deployment claims match implemented behavior.
- The repository passes typecheck, lint, tests, build, and security-focused regression checks.
- A deployment runbook and pilot pricing/packaging proposal are included.

## Current evidence and remaining blockers — 2026-11-28

The repository now includes durable API-key lifecycle controls, signed single-use approvals,
centralized redacted audit logging, SSRF-hardened webhook delivery, Stripe signature/idempotency
handling, Stripe Checkout session creation, and usage-event idempotency. The latest local evidence
is 62 passing tests, a passing TypeScript check, a successful production build, and lint with the
existing warning baseline only.

The remaining enterprise-readiness work is explicit: make the Supabase usage increment path atomic
under concurrency, complete billing-event parity if Stripe is used with Supabase rather than Neon,
finish deployment verification for the latest commit, and obtain external legal review of the
commercial license, DPA, SLA, and compliance language. The latest Vercel deployment attempt was
blocked by the account's daily deployment quota, so the newest commit must not be described as live
in Production until a READY deployment for its SHA is confirmed.
