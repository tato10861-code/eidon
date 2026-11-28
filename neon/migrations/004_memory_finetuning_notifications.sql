-- Migration 004: conversation memory, fine-tuning jobs, and notification preferences

-- Fine-tuning jobs
CREATE TABLE IF NOT EXISTS fine_tuning_jobs (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  base_model TEXT NOT NULL,
  data_source TEXT NOT NULL CHECK (data_source IN ('conversation_export', 'jsonl', 'raw')),
  training_examples_count INTEGER,
  validation_examples_count INTEGER,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled')),
  status_message TEXT,
  hyperparameters JSONB NOT NULL DEFAULT '{}',
  result_model TEXT,
  error_code TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  estimated_finish_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_workspace
  ON fine_tuning_jobs (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_status
  ON fine_tuning_jobs (workspace_id, status);

-- Notification preferences (per member × workspace)
CREATE TABLE IF NOT EXISTS notification_preferences (
  member_id TEXT NOT NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, workspace_id)
);

-- Notification events log (sent/queued notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  member_id TEXT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'critical')),
  metadata JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_workspace
  ON notifications (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_member
  ON notifications (member_id, created_at DESC) WHERE member_id IS NOT NULL;

-- Persistent conversation memory
CREATE TABLE IF NOT EXISTS conversation_memory (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  user_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('fact', 'preference', 'context', 'instruction')),
  content TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]',
  confidence REAL NOT NULL DEFAULT 0.8 CHECK (confidence BETWEEN 0 AND 1),
  reinforcement_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_memory_lookup
  ON conversation_memory (workspace_id, employee_id, user_id, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_type
  ON conversation_memory (workspace_id, employee_id, type);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_expiry
  ON conversation_memory (expires_at) WHERE expires_at IS NOT NULL;
