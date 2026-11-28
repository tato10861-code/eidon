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
create index if not exists idx_employees_workspace on employees(workspace_id);
create index if not exists idx_conversations_workspace on conversations(workspace_id);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_tool_calls_conversation on tool_calls(conversation_id);
create index if not exists idx_webhooks_workspace on webhooks(workspace_id);
create index if not exists idx_webhooks_active on webhooks(active) where active = true;
create index if not exists idx_webhook_deliveries_webhook on webhook_deliveries(webhook_id);
