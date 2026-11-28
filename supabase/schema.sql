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
create index if not exists idx_workspace_memberships_user on public.workspace_memberships(user_id);
create index if not exists idx_integration_credentials_workspace on public.integration_credentials(workspace_id);
create index if not exists idx_employees_workspace on public.employees(workspace_id);
create index if not exists idx_conversations_workspace on public.conversations(workspace_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_tool_calls_conversation on public.tool_calls(conversation_id);

-- Row-level security. The application also checks membership server-side, but
-- the database must remain safe if an anon key is ever used accidentally.
alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.integration_credentials enable row level security;
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

drop policy if exists "demo_all_workspaces" on public.workspaces;
drop policy if exists "demo_all_employees" on public.employees;
drop policy if exists "demo_all_conversations" on public.conversations;
drop policy if exists "demo_all_messages" on public.messages;
drop policy if exists "demo_all_tool_calls" on public.tool_calls;
drop policy if exists "demo_all_audit" on public.audit_log;
drop policy if exists "members can read memberships" on public.workspace_memberships;
drop policy if exists "admins can manage memberships" on public.workspace_memberships;
drop policy if exists "members can access integration credentials" on public.integration_credentials;

create policy "members can read memberships" on public.workspace_memberships
  for select using (user_id = auth.uid() or public.is_workspace_member(workspace_id));
create policy "users can create their owner membership" on public.workspace_memberships
  for insert with check (user_id = auth.uid() and role = 'owner');
create policy "admins can manage memberships" on public.workspace_memberships
  for update using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy "members can access integration credentials" on public.integration_credentials
  for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy "members can read workspaces" on public.workspaces
  for select using (public.is_workspace_member(id));
create policy "authenticated users can create workspaces" on public.workspaces
  for insert with check (auth.uid() is not null);
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
