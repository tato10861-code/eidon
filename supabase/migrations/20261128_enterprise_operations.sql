-- Eidon enterprise operations extension.
-- Non-destructive: creates append-only evidence tables and indexes only.

create table if not exists public.workspace_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  requested_by text not null,
  status text not null default 'requested' check (status in ('requested', 'approved', 'completed', 'cancelled')),
  reason text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.operational_alerts (
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
  on public.workspace_deletion_requests(workspace_id, requested_at desc);
create index if not exists idx_operational_alerts_unresolved
  on public.operational_alerts(created_at desc) where resolved_at is null;

alter table public.workspace_deletion_requests enable row level security;
alter table public.operational_alerts enable row level security;

-- Customer users may inspect only their own workspace's deletion requests.
drop policy if exists "members can read deletion requests" on public.workspace_deletion_requests;
create policy "members can read deletion requests" on public.workspace_deletion_requests
  for select using (public.is_workspace_member(workspace_id));

-- Operational alerts are operator evidence; writes are restricted to service_role.
revoke all on public.operational_alerts from anon, authenticated;
revoke all on public.workspace_deletion_requests from anon, authenticated;
