-- Eidon — Enterprise features schema migration (v2)
-- Adds: SCIM provisioning, session management, IP allowlist, RBAC members,
--       API keys, usage tracking, and billing columns on workspaces.

-- ─── Workspaces: enterprise columns ─────────────────────────────────────────

alter table workspaces
  add column if not exists subscription_status text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists billing_period_end timestamptz,
  add column if not exists seats integer not null default 1,
  add column if not exists ip_allowlist jsonb not null default '[]'::jsonb,
  add column if not exists scim_token text,
  add column if not exists sso_provider text,
  add column if not exists sso_domain text,
  add column if not exists updated_at timestamptz not null default now();

-- ─── Workspace members (RBAC) ────────────────────────────────────────────────

create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid not null,
  email text not null,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'member', 'viewer')),
  invited_by uuid,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, email)
);

create index if not exists idx_members_workspace on workspace_members(workspace_id);
create index if not exists idx_members_user on workspace_members(user_id);

-- ─── API keys ────────────────────────────────────────────────────────────────

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  prefix text not null,
  hash text not null unique,
  scopes jsonb not null default '["chat:read","chat:write"]'::jsonb,
  rate_limit integer not null default 60,
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_keys_workspace on api_keys(workspace_id);
create index if not exists idx_api_keys_hash on api_keys(hash);
create index if not exists idx_api_keys_prefix on api_keys(prefix);

-- ─── Sessions (enterprise session management) ────────────────────────────────

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid not null,
  token_hash text not null unique,
  ip_address inet,
  user_agent text,
  last_active_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_workspace on sessions(workspace_id);
create index if not exists idx_sessions_user on sessions(user_id);
create index if not exists idx_sessions_token on sessions(token_hash);
create index if not exists idx_sessions_active on sessions(workspace_id, revoked_at, expires_at);

-- ─── SCIM provisioned users ──────────────────────────────────────────────────

create table if not exists scim_users (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  external_id text,
  user_name text not null,
  given_name text,
  family_name text,
  display_name text,
  email text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_name)
);

create index if not exists idx_scim_users_workspace on scim_users(workspace_id);
create index if not exists idx_scim_users_username on scim_users(workspace_id, user_name);
create index if not exists idx_scim_users_external on scim_users(workspace_id, external_id);

-- ─── SCIM groups ─────────────────────────────────────────────────────────────

create table if not exists scim_groups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  external_id text,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, display_name)
);

create table if not exists scim_group_members (
  group_id uuid references scim_groups(id) on delete cascade,
  user_id uuid references scim_users(id) on delete cascade,
  primary key (group_id, user_id)
);

-- ─── Usage tracking ──────────────────────────────────────────────────────────

create table if not exists usage (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  month text not null,                   -- YYYY-MM
  api_calls integer not null default 0,
  chat_tokens bigint not null default 0,
  conversation_turns integer not null default 0,
  export_jobs integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (workspace_id, month)
);

create index if not exists idx_usage_workspace on usage(workspace_id);
create index if not exists idx_usage_month on usage(workspace_id, month desc);

-- ─── Integration tokens (OAuth apps, Slack, etc.) ───────────────────────────

create table if not exists integration_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  provider text not null,
  access_token text not null,
  refresh_token text,
  token_type text not null default 'bearer',
  scope text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider)
);

create index if not exists idx_integration_tokens_workspace on integration_tokens(workspace_id);

-- ─── Rate limit log (sliding window) ────────────────────────────────────────

create table if not exists rate_limit_log (
  id         bigserial primary key,
  key        text not null,
  tier       text not null default 'free',
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_log_key_time on rate_limit_log(key, created_at);

-- Auto-purge rows older than 5 minutes to keep the table small
-- (actual cleanup handled by a periodic job or pg_cron)

-- ─── Workspace settings column ───────────────────────────────────────────────

alter table workspaces
  add column if not exists settings jsonb not null default '{}';

-- ─── Employee templates ───────────────────────────────────────────────────────

create table if not exists employee_templates (
  id            text primary key,
  workspace_id  uuid references workspaces(id) on delete cascade,
  name          text not null,
  description   text,
  role          text not null,
  system_prompt text not null,
  model         text,
  temperature   real,
  tools         jsonb not null default '[]',
  tags          jsonb not null default '[]',
  is_public     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_employee_templates_workspace on employee_templates(workspace_id);
create index if not exists idx_employee_templates_public on employee_templates(is_public) where is_public = true;
