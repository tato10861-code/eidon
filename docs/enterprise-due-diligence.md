# Eidon enterprise due-diligence brief

## Positioning

Eidon is a licensable AI-employee platform foundation for companies that want role-specific AI workers with scoped tools, approvals, evaluation workflows, usage controls, and multi-tenant deployment primitives. The near-term commercial wedge is a paid pilot around one measurable workflow, followed by a Scale subscription or a private deployment license.

The defensible promise is not that every enterprise feature is already complete. The defensible promise is that the repository has a serious security and commercial foundation and is being advanced through evidence-based release gates.

## Shipped evidence in the current repository

The current codebase includes centralized workspace authorization, hashed API keys with expiry and revocation, signed expiry-bound single-use approvals, redacted audit writes, webhook target validation and retry delivery, Stripe signature verification and event idempotency, Stripe Checkout session creation, durable usage event IDs, plan entitlement checks, OpenAPI documentation, a CLI, and CI/CodeQL configuration.

The local release evidence for the previous checkpoint is 62 passing tests, a passing strict TypeScript check, a successful Next.js production build, and lint with warnings but no errors. The latest commits are pushed to `main`; they are not considered live until a Vercel deployment for the exact SHA reaches `READY`.

## Buyer due-diligence matrix

| Area             | Current evidence                                                                | Buyer-safe statement                                             | Required before a formal enterprise promise                                       |
| ---------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Tenant isolation | Authorization helpers, workspace IDs, Supabase RLS, Neon workspace predicates   | Workspace isolation is a design priority with automated coverage | Live database-backed cross-tenant and role-escalation tests                       |
| Billing          | Stripe Checkout, signed webhook parsing, idempotent billing events, plan limits | Stripe billing primitives are implemented                        | Provider-neutral lifecycle state machine and production webhook verification      |
| Usage            | Durable usage events and transactional Supabase RPC in schema                   | Usage accounting is designed to be idempotent                    | Apply the schema migration and run concurrency tests against the target database  |
| Integrations     | OAuth scaffolding, approval tokens, webhook delivery hardening                  | Integration security primitives exist                            | PKCE, token rotation/revocation, and provider-backed tool execution               |
| Audit            | Redaction and workspace-scoped audit records                                    | Security-relevant events can be recorded                         | Append-only/tamper-evident retention and operational alerting                     |
| Deployment       | Next.js/Vercel build, Docker assets, database schemas                           | SaaS deployment path exists                                      | Verified production SHA, private deployment runbook, backup/restore evidence      |
| Compliance       | Security, privacy, license, and DPA documentation                               | Documentation is prepared for review                             | External legal/security review; no SOC 2, GDPR, HIPAA, or SLA certification claim |

## Commercial packaging

**Pilot — $5k–$15k fixed fee, 30–60 days.** One workflow, one team, a bounded integration set, agreed success metrics, weekly review, and a written go/no-go report. The pilot should never promise a generic autonomous workforce; it should promise measurable progress on a named operational bottleneck.

**Scale — $499/month starting point.** Hosted workspace, selected AI employees, usage limits, API access, evaluation traces, and priority support. Final limits, model costs, data retention, and support response are defined in the order form.

**Enterprise — custom annual contract.** Private deployment, procurement support, custom integrations, security review assistance, and negotiated support are commercial options only when the corresponding implementation profile, documentation, and acceptance criteria are agreed in writing.

**OEM/license — custom.** License the platform foundation for embedding or white-labeling. The order form must define source-code access, support boundaries, update rights, model/provider responsibility, security obligations, redistribution rights, and any exclusivity. The public page must not be treated as the license itself.

## Investor diligence questions to answer with evidence

1. Which workflow produces the first measurable ROI, and what is the baseline?
2. What is the gross-margin model after model inference, storage, support, and customer-specific integration costs?
3. Which capabilities are repeatable product features versus forward-deployed services?
4. Which enterprise claims are implemented today, and which are roadmap or contractual options?
5. Can a customer export and delete its data, and can the operator prove that outcome?
6. Can the team reproduce a deployment from a clean checkout and verify the exact commit in production?
7. What is the integration moat: employee definitions, evaluation data, workflow telemetry, connectors, or distribution?

A credible data room should include this brief, the deployment runbook, security policy, license/DPA drafts, architecture diagram, test/coverage reports, a current dependency report, and a dated production deployment record. It should not include secrets or unverified customer, uptime, compliance, or ROI claims.
