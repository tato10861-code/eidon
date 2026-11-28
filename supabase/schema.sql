-- Eidon — Supabase schema (free tier compatible)
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- All tables use row-level security. Adjust policies to your auth model.

create extension if not exists "pgcrypto";

-- Workspaces (tenants)
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text not null default 'starter',
  region text not null default 'us',
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_memberships (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.integration_credentials (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  expires_at timestamptz,
  scopes jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, provider)
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  prefix text not null,
  hash text not null unique,
  name text not null,
  scopes jsonb not null default '[]',
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_monthly (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  period text not null,
  api_calls bigint not null default 0,
  chat_tokens bigint not null default 0,
  conversation_turns bigint not null default 0,
  export_jobs bigint not null default 0,
  employee_runs jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (workspace_id, period)
);

create table if not exists public.usage_events (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  metric text not null,
  amount bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_subscriptions (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  provider text not null default 'stripe',
  customer_id text,
  subscription_id text unique,
  status text not null default 'inactive',
  plan text not null default 'starter',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_events (
  id text primary key,
  type text not null,
  processed boolean not null default false,
  last_error text,
  created_at timestamptz not null default now()
);
alter table public.billing_events add column if not exists processed boolean not null default false;
alter table public.billing_events add column if not exists last_error text;

create table if not exists public.approval_tokens (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor text not null,
  tool text not null,
  action text not null,
  payload_hash text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.webhooks (
  id text primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  url text not null,
  events jsonb not null default '[]',
  signing_secret text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webhook_deliveries (
  id text primary key,
  webhook_id text references public.webhooks(id) on delete cascade,
  event text not null,
  payload jsonb not null,
  status_code integer,
  success boolean not null default false,
  attempt integer not null default 1,
  created_at timestamptz not null default now()
);

-- Employees (custom + cloned from templates)
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  template_id text,
  name text not null,
  role text not null,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Conversations
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  trace jsonb,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- Tool calls (audit)
create table if not exists public.tool_calls (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  message_id uuid references public.messages(id) on delete cascade,
  tool text not null,
  action text,
  status text not null default 'done',
  detail text,
  created_at timestamptz not null default now()
);

-- Audit log (append-only)
create table if not exists public.audit_log (
  id bigserial primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  actor text,
  action text not null,
  target text,
  payload jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log add column if not exists schema_version integer not null default 1;
alter table public.audit_log add column if not exists request_id text;
alter table public.audit_log add column if not exists actor_type text;
create or replace function public.prevent_audit_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_log is append-only';
end;
$$;
drop trigger if exists audit_log_append_only on public.audit_log;
create trigger audit_log_append_only
before update or delete on public.audit_log
for each row execute function public.prevent_audit_mutation();

create or replace function public.create_workspace_with_owner(
  p_name text,
  p_slug text,
  p_user_id uuid
)
returns public.workspaces
language plpgsql
security definer
set search_path = public
as $$
declare
  created public.workspaces;
begin
  if p_user_id is null then
    raise exception 'authenticated user mismatch';
  end if;
  insert into public.workspaces (name, slug, plan)
  values (trim(p_name), lower(trim(p_slug)), 'starter')
  returning * into created;
  insert into public.workspace_memberships (workspace_id, user_id, role)
  values (created.id, p_user_id, 'owner');
  return created;
end;
$$;

-- Indexes
create index if not exists idx_workspace_memberships_user on public.workspace_memberships(user_id);
create index if not exists idx_integration_credentials_workspace on public.integration_credentials(workspace_id);
create index if not exists idx_api_keys_workspace on public.api_keys(workspace_id);
create index if not exists idx_usage_events_workspace on public.usage_events(workspace_id, created_at);
create index if not exists idx_approval_tokens_workspace on public.approval_tokens(workspace_id);
create index if not exists idx_approval_tokens_expiry on public.approval_tokens(expires_at);
create index if not exists idx_webhooks_workspace on public.webhooks(workspace_id);
create index if not exists idx_webhook_deliveries_webhook on public.webhook_deliveries(webhook_id);
create index if not exists idx_usage_monthly_workspace on public.usage_monthly(workspace_id);
create index if not exists idx_billing_events_created on public.billing_events(created_at);
create index if not exists idx_employees_workspace on public.employees(workspace_id);
create index if not exists idx_conversations_workspace on public.conversations(workspace_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_tool_calls_conversation on public.tool_calls(conversation_id);

-- Row-level security. The application also checks membership server-side, but
-- the database must remain safe if an anon key is ever used accidentally.
alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.integration_credentials enable row level security;
alter table public.api_keys enable row level security;
alter table public.usage_monthly enable row level security;
alter table public.usage_events enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_events enable row level security;
alter table public.approval_tokens enable row level security;
alter table public.webhooks enable row level security;
alter table public.webhook_deliveries enable row level security;
alter table public.employees enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.tool_calls enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_memberships
    where workspace_id = target_workspace and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_admin(target_workspace uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_memberships
    where workspace_id = target_workspace
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

-- Atomically records a usage event and updates the monthly ledger. The unique
-- event id makes provider/request retries safe under concurrent execution.
create or replace function public.record_usage(
  p_event_id text,
  p_workspace_id uuid,
  p_period text,
  p_metric text,
  p_amount bigint,
  p_employee_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted boolean;
begin
  if p_metric not in ('api_calls', 'chat_tokens', 'conversation_turns', 'export_jobs')
    or p_amount < 0 then
    raise exception 'invalid usage event';
  end if;

  insert into public.usage_events (id, workspace_id, metric, amount)
  values (p_event_id, p_workspace_id, p_metric, p_amount)
  on conflict (id) do nothing;
  inserted := found;
  if not inserted then return false; end if;

  insert into public.usage_monthly (workspace_id, period, employee_runs)
  values (
    p_workspace_id,
    p_period,
    case when p_employee_id is null then '{}'::jsonb
      else jsonb_build_object(p_employee_id, 1) end
  )
  on conflict (workspace_id, period) do update set
    api_calls = usage_monthly.api_calls + case when p_metric = 'api_calls' then p_amount else 0 end,
    chat_tokens = usage_monthly.chat_tokens + case when p_metric = 'chat_tokens' then p_amount else 0 end,
    conversation_turns = usage_monthly.conversation_turns + case when p_metric = 'conversation_turns' then p_amount else 0 end,
    export_jobs = usage_monthly.export_jobs + case when p_metric = 'export_jobs' then p_amount else 0 end,
    employee_runs = case when p_employee_id is null then usage_monthly.employee_runs else
      jsonb_set(
        usage_monthly.employee_runs,
        array[p_employee_id],
        to_jsonb(coalesce((usage_monthly.employee_runs ->> p_employee_id)::bigint, 0) + 1),
        true
      ) end,
    updated_at = now();
  return true;
end;
$$;

revoke execute on function public.record_usage(text, uuid, text, text, bigint, text) from public;
grant execute on function public.record_usage(text, uuid, text, text, bigint, text) to service_role;
revoke execute on function public.create_workspace_with_owner(text, text, uuid) from public;
grant execute on function public.create_workspace_with_owner(text, text, uuid) to service_role;

create or replace function public.reserve_usage(
  p_event_id text,
  p_workspace_id uuid,
  p_period text,
  p_metric text,
  p_amount bigint,
  p_employee_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_name text;
  limit_value bigint;
  current_value bigint;
begin
  if p_amount <= 0 or p_metric not in ('api_calls', 'chat_tokens', 'conversation_turns', 'export_jobs') then
    raise exception 'invalid usage reservation';
  end if;
  if exists (select 1 from public.usage_events where id = p_event_id) then return true; end if;
  select case when s.status in ('active', 'trialing') then s.plan else w.plan end
    into plan_name
    from public.workspaces w left join public.billing_subscriptions s on s.workspace_id = w.id
    where w.id = p_workspace_id;
  plan_name := coalesce(plan_name, 'starter');
  limit_value := case plan_name
    when 'scale' then case p_metric when 'api_calls' then 250000 when 'chat_tokens' then 10000000 when 'conversation_turns' then 25000 when 'export_jobs' then 250 end
    when 'enterprise' then null
    else case p_metric when 'api_calls' then 10000 when 'chat_tokens' then 250000 when 'conversation_turns' then 1000 when 'export_jobs' then 10 end
  end;
  insert into public.usage_monthly (workspace_id, period) values (p_workspace_id, p_period)
    on conflict (workspace_id, period) do nothing;
  select case p_metric when 'api_calls' then api_calls when 'chat_tokens' then chat_tokens when 'conversation_turns' then conversation_turns when 'export_jobs' then export_jobs end
    into current_value from public.usage_monthly where workspace_id = p_workspace_id and period = p_period for update;
  if limit_value is not null and current_value + p_amount > limit_value then return false; end if;
  insert into public.usage_events (id, workspace_id, metric, amount) values (p_event_id, p_workspace_id, p_metric, p_amount);
  update public.usage_monthly set
    api_calls = api_calls + case when p_metric = 'api_calls' then p_amount else 0 end,
    chat_tokens = chat_tokens + case when p_metric = 'chat_tokens' then p_amount else 0 end,
    conversation_turns = conversation_turns + case when p_metric = 'conversation_turns' then p_amount else 0 end,
    export_jobs = export_jobs + case when p_metric = 'export_jobs' then p_amount else 0 end,
    employee_runs = case when p_employee_id is null then employee_runs else jsonb_set(employee_runs, array[p_employee_id], to_jsonb(coalesce((employee_runs ->> p_employee_id)::bigint, 0) + 1), true) end,
    updated_at = now()
    where workspace_id = p_workspace_id and period = p_period;
  return true;
end;
$$;
revoke execute on function public.reserve_usage(text, uuid, text, text, bigint, text) from public;
grant execute on function public.reserve_usage(text, uuid, text, text, bigint, text) to service_role;

drop policy if exists "demo_all_workspaces" on public.workspaces;
drop policy if exists "demo_all_employees" on public.employees;
drop policy if exists "demo_all_conversations" on public.conversations;
drop policy if exists "demo_all_messages" on public.messages;
drop policy if exists "demo_all_tool_calls" on public.tool_calls;
drop policy if exists "demo_all_audit" on public.audit_log;
drop policy if exists "members can read memberships" on public.workspace_memberships;
drop policy if exists "admins can manage memberships" on public.workspace_memberships;
drop policy if exists "admins can insert memberships" on public.workspace_memberships;
drop policy if exists "members can access integration credentials" on public.integration_credentials;
drop policy if exists "admins can access api keys" on public.api_keys;
drop policy if exists "members can read usage" on public.usage_monthly;
drop policy if exists "members can read usage events" on public.usage_events;
drop policy if exists "admins can read billing" on public.billing_subscriptions;
drop policy if exists "admins can read billing events" on public.billing_events;
drop policy if exists "members can use approvals" on public.approval_tokens;
drop policy if exists "admins can manage webhooks" on public.webhooks;
drop policy if exists "members can read webhook deliveries" on public.webhook_deliveries;

create policy "members can read memberships" on public.workspace_memberships
  for select using (user_id = auth.uid() or public.is_workspace_member(workspace_id));
create policy "admins can insert memberships" on public.workspace_memberships
  for insert with check (public.is_workspace_admin(workspace_id) and role <> 'owner');
create policy "admins can update memberships" on public.workspace_memberships
  for update using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id) and role <> 'owner');
create policy "members can access integration credentials" on public.integration_credentials
  for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "admins can access api keys" on public.api_keys
  for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can read usage" on public.usage_monthly
  for select using (public.is_workspace_member(workspace_id));
create policy "members can read usage events" on public.usage_events
  for select using (public.is_workspace_member(workspace_id));
create policy "admins can read billing" on public.billing_subscriptions
  for select using (public.is_workspace_member(workspace_id));
create policy "admins can read billing events" on public.billing_events
  for select using (false);
create policy "members can use approvals" on public.approval_tokens
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy "admins can manage webhooks" on public.webhooks
  for all using (exists (select 1 from public.workspace_memberships m where m.workspace_id = webhooks.workspace_id and m.user_id = auth.uid() and m.role in ('owner','admin')))
  with check (exists (select 1 from public.workspace_memberships m where m.workspace_id = webhooks.workspace_id and m.user_id = auth.uid() and m.role in ('owner','admin')));
create policy "members can read webhook deliveries" on public.webhook_deliveries
  for select using (exists (select 1 from public.webhooks w where w.id = webhook_id and public.is_workspace_member(w.workspace_id)));

create policy "members can read workspaces" on public.workspaces
  for select using (public.is_workspace_member(id));
drop policy if exists "authenticated users can create workspaces" on public.workspaces;
create policy "members can update workspaces" on public.workspaces
  for update using (public.is_workspace_member(id)) with check (public.is_workspace_member(id));

create policy "members can access employees" on public.employees
  for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access conversations" on public.conversations
  for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access messages" on public.messages
  for all using (exists (select 1 from public.conversations c where c.id = conversation_id and public.is_workspace_member(c.workspace_id)))
  with check (exists (select 1 from public.conversations c where c.id = conversation_id and public.is_workspace_member(c.workspace_id)));
create policy "members can access tool calls" on public.tool_calls
  for all using (exists (select 1 from public.conversations c where c.id = conversation_id and public.is_workspace_member(c.workspace_id)))
  with check (exists (select 1 from public.conversations c where c.id = conversation_id and public.is_workspace_member(c.workspace_id)));
create policy "members can read audit" on public.audit_log
  for select using (public.is_workspace_member(workspace_id));
