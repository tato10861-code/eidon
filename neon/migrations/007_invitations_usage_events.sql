-- Migration 007: workspace invitations and usage event ledger

-- Workspace invitations (email-based member onboarding)
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner','admin','member','viewer')),
  token TEXT NOT NULL UNIQUE,            -- secure random token for acceptance link
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','expired','revoked')),
  invited_by TEXT,                       -- user_id of inviter
  message TEXT,                          -- optional personal message
  accepted_by TEXT,                      -- user_id of acceptor (set on accept)
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,       -- default: 7 days
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_pending_email
  ON workspace_invitations (workspace_id, email)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_invitations_token
  ON workspace_invitations (token) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_invitations_workspace
  ON workspace_invitations (workspace_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invitations_email
  ON workspace_invitations (email, status);

-- Usage events ledger (granular per-call tracking for billing/analytics)
CREATE TABLE IF NOT EXISTS usage_events (
  id BIGSERIAL NOT NULL,
  workspace_id UUID NOT NULL,
  employee_id UUID,
  conversation_id UUID,
  user_id TEXT,
  model TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'completion'
    CHECK (event_type IN ('completion','embedding','moderation','fine_tune','tool_call')),
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(12, 8) NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Current and upcoming month partitions
CREATE TABLE IF NOT EXISTS usage_events_2026_11
  PARTITION OF usage_events
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE IF NOT EXISTS usage_events_2026_12
  PARTITION OF usage_events
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

CREATE TABLE IF NOT EXISTS usage_events_2027_01
  PARTITION OF usage_events
  FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');

-- Indexes on the parent table (inherited by partitions)
CREATE INDEX IF NOT EXISTS idx_usage_events_workspace_created
  ON usage_events (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_employee
  ON usage_events (workspace_id, employee_id, created_at DESC)
  WHERE employee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usage_events_model
  ON usage_events (workspace_id, model, created_at DESC);

-- Daily aggregation materialized view (for fast dashboard queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS usage_daily_summary AS
SELECT
  workspace_id,
  employee_id,
  model,
  DATE_TRUNC('day', created_at) AS day,
  COUNT(*) AS request_count,
  SUM(prompt_tokens) AS prompt_tokens,
  SUM(completion_tokens) AS completion_tokens,
  SUM(total_tokens) AS total_tokens,
  SUM(cost_usd) AS cost_usd,
  AVG(latency_ms) AS avg_latency_ms,
  COUNT(*) FILTER (WHERE error IS NOT NULL) AS error_count
FROM usage_events
GROUP BY workspace_id, employee_id, model, DATE_TRUNC('day', created_at)
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_daily_summary_pk
  ON usage_daily_summary (workspace_id, COALESCE(employee_id, '00000000-0000-0000-0000-000000000000'::uuid), model, day);

CREATE INDEX IF NOT EXISTS idx_usage_daily_summary_workspace
  ON usage_daily_summary (workspace_id, day DESC);
