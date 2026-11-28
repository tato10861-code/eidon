-- Migration 001: Add billing columns and subscription tracking
-- Run after the base schema (neon/schema.sql)

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status    text not null default 'active',
  ADD COLUMN IF NOT EXISTS billing_period_end     timestamptz,
  ADD COLUMN IF NOT EXISTS seats                  integer not null default 1,
  ADD COLUMN IF NOT EXISTS updated_at             timestamptz not null default now();

CREATE TABLE IF NOT EXISTS subscriptions (
  id                   text primary key,
  workspace_id         uuid references workspaces(id) on delete cascade,
  stripe_id            text unique not null,
  plan                 text not null,
  status               text not null default 'active',
  current_period_start timestamptz not null,
  current_period_end   timestamptz not null,
  cancel_at_period_end boolean not null default false,
  trial_end            timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id                 text primary key,
  workspace_id       uuid references workspaces(id) on delete cascade,
  stripe_id          text unique not null,
  subscription_id    text references subscriptions(id),
  amount_due         integer not null,
  amount_paid        integer not null default 0,
  currency           text not null default 'usd',
  status             text not null default 'draft',
  hosted_invoice_url text,
  invoice_pdf        text,
  period_start       timestamptz,
  period_end         timestamptz,
  created_at         timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_customer
  ON workspaces(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_workspace ON subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status   ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_workspace      ON invoices(workspace_id);
