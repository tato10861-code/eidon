-- Migration 006: third-party integrations, knowledge base, and data export jobs

-- Third-party integration configurations
CREATE TABLE IF NOT EXISTS workspace_integrations (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL
    CHECK (provider IN ('slack','teams','jira','github','zendesk',
                        'pagerduty','linear','salesforce','hubspot',
                        'intercom','webhook')),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','inactive','error','pending_auth')),
  config JSONB NOT NULL DEFAULT '{}',
  events JSONB NOT NULL DEFAULT '[]',
  last_delivered_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error TEXT,
  delivery_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_integrations_workspace
  ON workspace_integrations (workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_integrations_provider
  ON workspace_integrations (workspace_id, provider);
CREATE INDEX IF NOT EXISTS idx_workspace_integrations_status
  ON workspace_integrations (workspace_id, status);

-- Knowledge base documents for RAG grounding
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL
    CHECK (type IN ('text','markdown','faq','policy','procedure',
                    'product','support','code','json','csv')),
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('active','processing','archived','failed')),
  tags JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  source_url TEXT,
  chunk_count INTEGER,
  token_count INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_workspace
  ON knowledge_documents (workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_employee
  ON knowledge_documents (workspace_id, employee_id, status)
  WHERE employee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_type
  ON knowledge_documents (workspace_id, type, status);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_hash
  ON knowledge_documents (content_hash);

-- Full-text search index for knowledge retrieval
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_fulltext
  ON knowledge_documents USING gin(to_tsvector('english', title || ' ' || content))
  WHERE status = 'active';

-- Data export jobs (GDPR / data portability)
CREATE TABLE IF NOT EXISTS data_export_jobs (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  requested_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','completed','failed')),
  include_conversations BOOLEAN NOT NULL DEFAULT true,
  include_audit_log BOOLEAN NOT NULL DEFAULT true,
  date_from TIMESTAMPTZ,
  date_to TIMESTAMPTZ,
  entity_counts JSONB,
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_export_jobs_workspace
  ON data_export_jobs (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_export_jobs_status
  ON data_export_jobs (status)
  WHERE status IN ('pending', 'running');

-- Add full-text search capability to employees for discovery
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english', coalesce(name, '') || ' ' || coalesce(role, ''))
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_employees_search
  ON employees USING gin(search_vector);

-- Extend conversations table if columns are missing
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS message_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_tokens INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_conversations_workspace_created
  ON conversations (workspace_id, created_at DESC);
