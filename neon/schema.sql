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

create index if not exists idx_employees_workspace on employees(workspace_id);
create index if not exists idx_conversations_workspace on conversations(workspace_id);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_tool_calls_conversation on tool_calls(conversation_id);
