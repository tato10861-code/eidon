-- Migration 005: workspace budgets and audit log enhancements

-- Workspace/employee/member spending budgets
CREATE TABLE IF NOT EXISTS workspace_budgets (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('workspace', 'employee', 'member')),
  target_id TEXT,
  limit_usd NUMERIC(12, 4) NOT NULL,
  current_spend_usd NUMERIC(12, 4) NOT NULL DEFAULT 0,
  reset_period TEXT NOT NULL DEFAULT 'monthly'
    CHECK (reset_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual', 'none')),
  last_reset_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_reset_at TIMESTAMPTZ,
  action TEXT NOT NULL DEFAULT 'warn_and_block'
    CHECK (action IN ('block', 'warn', 'warn_and_block')),
  warning_threshold_pct INTEGER NOT NULL DEFAULT 80
    CHECK (warning_threshold_pct BETWEEN 1 AND 100),
  alert_emails JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_budgets_workspace
  ON workspace_budgets (workspace_id, type);
CREATE INDEX IF NOT EXISTS idx_workspace_budgets_reset
  ON workspace_budgets (next_reset_at) WHERE next_reset_at IS NOT NULL AND is_active = true;

-- Extend audit_log if ip_address and user_agent columns are missing
-- (safe to run multiple times)
ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;
