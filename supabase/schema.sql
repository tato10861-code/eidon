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

-- Indexes
create index if not exists idx_employees_workspace on public.employees(workspace_id);
create index if not exists idx_conversations_workspace on public.conversations(workspace_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_tool_calls_conversation on public.tool_calls(conversation_id);

-- Row level security (enable; policies are permissive for demo, tighten for prod)
alter table public.workspaces enable row level security;
alter table public.employees enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.tool_calls enable row level security;
alter table public.audit_log enable row level security;

-- Demo policies: allow anon read/write. REPLACE with auth-based policies in production.
do $$ begin
  create policy "demo_all_workspaces" on public.workspaces for all using (true) with check (true);
  create policy "demo_all_employees" on public.employees for all using (true) with check (true);
  create policy "demo_all_conversations" on public.conversations for all using (true) with check (true);
  create policy "demo_all_messages" on public.messages for all using (true) with check (true);
  create policy "demo_all_tool_calls" on public.tool_calls for all using (true) with check (true);
  create policy "demo_all_audit" on public.audit_log for all using (true) with check (true);
exception when duplicate_object then null; end $$;
