-- Eidon enterprise operations extension.
-- Non-destructive: creates append-only evidence tables and indexes only.

create table if not exists workspace_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  requested_by text not null,
  status text not null default 'requested' check (status in ('requested', 'approved', 'completed', 'cancelled')),
  reason text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists operational_alerts (
  id uuid primary key default gen_random_uuid(),
  severity text not null check (severity in ('info', 'warning', 'critical')),
  source text not null,
  code text not null,
  message text not null,
  context jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_workspace_deletion_requests_workspace
  on workspace_deletion_requests(workspace_id, requested_at desc);
create index if not exists idx_operational_alerts_unresolved
  on operational_alerts(created_at desc) where resolved_at is null;
