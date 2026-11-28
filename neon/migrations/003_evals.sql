-- Migration 003: AI Evals infrastructure
-- Stores eval suites, run history, and per-case scores.

CREATE TABLE IF NOT EXISTS eval_suites (
  id           TEXT PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  employee_id  UUID REFERENCES employees(id) ON DELETE SET NULL,
  cases        JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eval_suites_workspace ON eval_suites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_eval_suites_employee ON eval_suites(employee_id);

CREATE TABLE IF NOT EXISTS eval_runs (
  id           TEXT PRIMARY KEY,
  suite_id     TEXT NOT NULL REFERENCES eval_suites(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  employee_id  UUID REFERENCES employees(id) ON DELETE SET NULL,
  model        TEXT,
  started_at   TIMESTAMPTZ NOT NULL,
  finished_at  TIMESTAMPTZ NOT NULL,
  duration_ms  INTEGER NOT NULL DEFAULT 0,
  passed_cases INTEGER NOT NULL DEFAULT 0,
  failed_cases INTEGER NOT NULL DEFAULT 0,
  total_cases  INTEGER NOT NULL DEFAULT 0,
  score        REAL NOT NULL DEFAULT 0,
  results      JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eval_runs_suite ON eval_runs(suite_id);
CREATE INDEX IF NOT EXISTS idx_eval_runs_workspace ON eval_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_eval_runs_employee ON eval_runs(employee_id);
CREATE INDEX IF NOT EXISTS idx_eval_runs_started ON eval_runs(started_at DESC);
