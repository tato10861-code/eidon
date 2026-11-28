# Eidon deployment runbook

## Scope

This runbook is for a controlled SaaS or private pilot deployment. It is not a promise of uptime, compliance certification, or air-gapped support. Those require a signed service profile and an environment-specific acceptance test.

## Preflight

1. Confirm the repository SHA, Node version from `.nvmrc`, lockfile, and clean working tree.
2. Configure secrets outside Git. At minimum, production authentication/database settings must be present. Stripe requires `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the configured Scale/Enterprise price IDs. Approval-protected tools require `EIDON_APPROVAL_SECRET`.
3. Apply the complete target database schema. For Supabase, confirm the `record_usage` RPC exists and is executable only by the server role. Confirm billing events, subscriptions, usage events, RLS, and indexes exist.
4. Set `NEXT_PUBLIC_SITE_URL` to the actual customer-facing origin. Never use a preview or stale domain in production configuration.
5. Confirm the model/provider endpoint, spending limits, retention policy, webhook egress policy, and support contact in the order form.

## Build and verification

Run from a clean checkout:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run format:check
```

Record the commit SHA, test count, build result, lint warning count, and the target database migration revision. A successful local build is not evidence that a production deployment is live.

## Smoke checks

After deployment, verify an unauthenticated health response, authenticated workspace authorization, rejected cross-workspace access, API-key creation/list/revocation, a bounded chat request, usage increment with an idempotency key, Stripe signature rejection for a bad signature, webhook target rejection for a private address, and a customer export that returns only durable records.

For every smoke check, record timestamp, deployment URL, exact SHA, response class, and operator. Do not store API keys or customer content in the report.

## Rollback

Rollback only to a deployment whose SHA and database compatibility are known. Stop new migrations first, route traffic to the last READY deployment, and preserve the failed deployment logs. If a schema change is not backward compatible, follow the migration's rollback or forward-fix procedure; never restore a database blindly over customer data.

## Evidence package

The release folder should contain the commit SHA, CI links, build output summary, schema revision, smoke-test report, deployment provider record, security review notes, and unresolved-risk register. The release is not “Production READY” until the deployment provider reports READY for the exact SHA and the health/smoke checks pass.
