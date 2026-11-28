# Staging verification protocol

This protocol is intentionally non-destructive. It does not run against customer data, does not delete rows, and does not place credentials in Git. Run it only against a disposable Supabase or Neon staging database created for this release.

## 1. Static and clean-checkout verification

```bash
npm ci
npm run verify:schema
npm run typecheck
npm test
npm run lint
npm run build
```

Record the exact commit SHA, Node version, schema revision, test count, lint warning count, and operator.

## 2. Apply schema to staging

For a new disposable database, apply the complete provider schema first, then the matching non-destructive operations migration:

```bash
# Supabase SQL editor or approved psql connection
\i supabase/schema.sql
\i supabase/migrations/20261128_enterprise_operations.sql

# Neon SQL editor or approved psql connection
\i neon/schema.sql
\i neon/migrations/20261128_enterprise_operations.sql
```

Do not run these commands against production until the change-control owner approves the migration revision.

## 3. RLS and tenant-isolation checks

Create two staging users and two workspaces. Verify that user A can read only workspace A, cannot read or mutate workspace B, cannot promote a member to owner, and cannot access credentials, keys, usage, conversations, messages, webhooks, or audit rows belonging to workspace B. Verify the same cases through the application API with session cookies and API keys.

Record each request class, expected status, observed status, timestamp, SHA, and database provider. Never record tokens or customer content.

## 4. Concurrency checks

Using two independent database connections, issue concurrent `reserve_usage` calls with the same event ID and then with distinct event IDs that together cross the plan limit. The expected result is one durable event for the duplicate ID, no counter overshoot, and a rejected reservation once the limit is reached. Repeat for Supabase and Neon staging.

## 5. Deletion, retention, and restore evidence

The operations migration creates an append-only deletion-request record and operational-alert store; it does not delete customer data. Before enabling a destructive deletion worker, document the retention interval, backup provider, encryption, restore owner, restore point objective, restore time objective, and legal hold behavior. Perform a restore into a separate database, verify row counts and tenant isolation, and attach the provider's backup/restore receipt to the release evidence package.

## 6. Alerting

Route unresolved `critical` rows from `operational_alerts` to the approved operator channel. Test database write failure, billing reconciliation failure, webhook retry exhaustion, and repeated authentication failures. Record alert delivery latency and acknowledgement. Do not describe alerting as production-ready until an operator has acknowledged a staging test event.
