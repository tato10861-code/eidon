# Eidon commercialization plan

## Goal

Move Eidon from a polished demo/reference implementation toward a defensible, sellable SaaS and private-deployment product. The immediate priority is to make tenant boundaries and server-side authorization real, then add durable usage/billing foundations, secure integrations, and evidence-backed commercial documentation.

## Delivery strategy

Work in production-risk order rather than feature-count order:

1. **Security foundation:** central request authentication, API-key verification, scope checks, workspace membership, safe defaults, and removal of client-controlled trust boundaries.
2. **Data isolation:** replace permissive demo policies with authenticated Supabase RLS; document the separate Neon access model and add isolation tests.
3. **Durable commercial primitives:** usage ledger, plan entitlements, idempotent billing event model, and operational audit records. Stripe wiring remains configuration-dependent until credentials are available.
4. **Integration safety:** OAuth state/PKCE and token lifecycle, server-side approvals, webhook SSRF protection, replay protection, and secret handling.
5. **Quality and trust:** route-level security tests, corrected licensing/marketing claims, security runbook, deployment checklist, and reproducible verification.
6. **Positioning:** package the product around a focused wedge (Arabic/English AI employees, private deployment, or white-label orchestration) instead of competing as a generic agent platform.

## Project structure

- `app/api/`: authenticated HTTP boundary and request validation.
- `lib/auth/`: session, API-key, workspace membership, and scope resolution.
- `lib/billing/`: plan limits, usage events, and billing-provider adapters.
- `lib/security/`: SSRF checks, approval verification, audit helpers, and safe parsing.
- `supabase/` and `neon/`: database schema and migration guidance.
- `tests/`: unit and security regression tests.
- `docs/`: deployment, security, licensing, and commercial-readiness evidence.

## Design direction

- **Movement:** editorial enterprise control room with a restrained cybernetic signal layer.
- **Core principles:** evidence over claims; explicit trust boundaries; calm, high-density operations; bilingual clarity.
- **Color philosophy:** preserve the near-black canvas and acid-lime signal, but reserve lime for verified state and actions that are safe to execute.
- **Layout paradigm:** asymmetrical editorial panels with a persistent operational rail rather than generic centered SaaS cards.
- **Signature elements:** trace lines, role cards, and explicit approval states.
- **Interaction philosophy:** every consequential action exposes actor, scope, policy, and result.
- **Typography:** keep the existing serif display / Inter interface / JetBrains Mono machine language system and IBM Plex Sans Arabic for RTL.
- **Brand essence:** governed AI employees for companies that need work completed, not merely generated. Personality: precise, direct, dependable.

## Commercial assumptions

The codebase alone cannot guarantee profitability. A credible offer will require at least one focused customer outcome, a support/security package, and evidence from pilots. Initial monetization should favor annual private deployment or white-label licensing over unbounded generic SaaS pricing.
