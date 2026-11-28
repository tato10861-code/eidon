-- Eidon — Neon (serverless Postgres) schema
-- Run in: Neon Console -> SQL Editor -> Run (or psql)
-- Compatible with the Supabase schema; tables are identical.

create extension if not exists "pgcrypto";

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text not null default 'starter',
  region text not null default 'us',
  created_at timestamptz not null default now()
);

create table if not exists workspace_memberships (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists integration_credentials (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider text not null,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  expires_at timestamptz,
  scopes jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, provider)
);

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  prefix text not null,
  hash text not null unique,
  name text not null,
  scopes jsonb not null default '[]',
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists usage_monthly (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  period text not null,
  api_calls bigint not null default 0,
  chat_tokens bigint not null default 0,
  conversation_turns bigint not null default 0,
  export_jobs bigint not null default 0,
  employee_runs jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (workspace_id, period)
);

create table if not exists usage_events (
  id text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  metric text not null,
  amount bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists billing_subscriptions (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  provider text not null default 'stripe',
  customer_id text,
  subscription_id text unique,
  status text not null default 'inactive',
  plan text not null default 'starter',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists approval_tokens (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  actor text not null,
  tool text not null,
  action text not null,
  payload_hash text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists billing_events (
  id text primary key,
  type text not null,
  processed boolean not null default false,
  last_error text,
  created_at timestamptz not null default now()
);
alter table billing_events add column if not exists processed boolean not null default false;
alter table billing_events add column if not exists last_error text;

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  template_id text,
  name text not null,
  role text not null,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  employee_id uuid references employees(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  trace jsonb,
  meta jsonb,
  created_at timestamptz not null default now()
);

create table if not exists tool_calls (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  message_id uuid references messages(id) on delete cascade,
  tool text not null,
  action text,
  status text not null default 'done',
  detail text,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id bigserial primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  actor text,
  action text not null,
  target text,
  payload jsonb,
  created_at timestamptz not null default now()
);
alter table audit_log add column if not exists schema_version integer not null default 1;
alter table audit_log add column if not exists request_id text;
alter table audit_log add column if not exists actor_type text;
create or replace function prevent_audit_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_log is append-only';
end;
$$;
drop trigger if exists audit_log_append_only on audit_log;
create trigger audit_log_append_only
before update or delete on audit_log
for each row execute function prevent_audit_mutation();

create or replace function create_workspace_with_owner(
  p_name text,
  p_slug text,
  p_user_id uuid
)
returns workspaces
language plpgsql
as $$
declare
  created workspaces;
begin
  insert into workspaces (name, slug, plan)
  values (trim(p_name), lower(trim(p_slug)), 'starter')
  returning * into created;
  insert into workspace_memberships (workspace_id, user_id, role)
  values (created.id, p_user_id, 'owner');
  return created;
end;
$$;

create table if not exists webhooks (
  id text primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  url text not null,
  events jsonb not null default '[]',
  signing_secret text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists webhook_deliveries (
  id text primary key,
  webhook_id text references webhooks(id) on delete cascade,
  event text not null,
  payload jsonb not null,
  status_code integer,
  success boolean not null default false,
  attempt integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_workspace_memberships_user on workspace_memberships(user_id);
create index if not exists idx_integration_credentials_workspace on integration_credentials(workspace_id);
create index if not exists idx_api_keys_workspace on api_keys(workspace_id);
create index if not exists idx_usage_events_workspace on usage_events(workspace_id, created_at);
create index if not exists idx_approval_tokens_workspace on approval_tokens(workspace_id);
create index if not exists idx_approval_tokens_expiry on approval_tokens(expires_at);
create index if not exists idx_employees_workspace on employees(workspace_id);
create index if not exists idx_conversations_workspace on conversations(workspace_id);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_tool_calls_conversation on tool_calls(conversation_id);
create index if not exists idx_webhooks_workspace on webhooks(workspace_id);
create index if not exists idx_webhooks_active on webhooks(active) where active = true;
create index if not exists idx_webhook_deliveries_webhook on webhook_deliveries(webhook_id);

create or replace function reserve_usage(
  p_event_id text, p_workspace_id uuid, p_period text, p_metric text,
  p_amount bigint, p_employee_id text default null
)
returns boolean
language plpgsql
as $$
declare
  plan_name text;
  limit_value bigint;
  current_value bigint;
begin
  if p_amount <= 0 or p_metric not in ('api_calls', 'chat_tokens', 'conversation_turns', 'export_jobs') then
    raise exception 'invalid usage reservation';
  end if;
  -- Serialize concurrent retries that carry the same event id so the
  -- idempotency check below is authoritative (no duplicate-key 500s).
  perform pg_advisory_xact_lock(hashtext(p_event_id)::bigint);
  if exists (select 1 from usage_events where id = p_event_id) then return true; end if;
  select case when s.status in ('active', 'trialing') then s.plan else w.plan end into plan_name
    from workspaces w left join billing_subscriptions s on s.workspace_id = w.id where w.id = p_workspace_id;
  plan_name := coalesce(plan_name, 'starter');
  limit_value := case plan_name
    when 'scale' then case p_metric when 'api_calls' then 250000 when 'chat_tokens' then 10000000 when 'conversation_turns' then 25000 when 'export_jobs' then 250 end
    when 'enterprise' then null
    else case p_metric when 'api_calls' then 10000 when 'chat_tokens' then 250000 when 'conversation_turns' then 1000 when 'export_jobs' then 10 end
  end;
  insert into usage_monthly (workspace_id, period) values (p_workspace_id, p_period) on conflict (workspace_id, period) do nothing;
  select case p_metric when 'api_calls' then api_calls when 'chat_tokens' then chat_tokens when 'conversation_turns' then conversation_turns when 'export_jobs' then export_jobs end into current_value
    from usage_monthly where workspace_id = p_workspace_id and period = p_period for update;
  if limit_value is not null and current_value + p_amount > limit_value then return false; end if;
  insert into usage_events (id, workspace_id, metric, amount) values (p_event_id, p_workspace_id, p_metric, p_amount);
  update usage_monthly set
    api_calls = api_calls + case when p_metric = 'api_calls' then p_amount else 0 end,
    chat_tokens = chat_tokens + case when p_metric = 'chat_tokens' then p_amount else 0 end,
    conversation_turns = conversation_turns + case when p_metric = 'conversation_turns' then p_amount else 0 end,
    export_jobs = export_jobs + case when p_metric = 'export_jobs' then p_amount else 0 end,
    employee_runs = case when p_employee_id is null then employee_runs else jsonb_set(employee_runs, array[p_employee_id], to_jsonb(coalesce((employee_runs ->> p_employee_id)::bigint, 0) + 1), true) end,
    updated_at = now() where workspace_id = p_workspace_id and period = p_period;
  return true;
end;
$$;
