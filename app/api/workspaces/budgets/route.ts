/**
 * Usage budget and cost controls API.
 *
 * Enterprise buyers need hard spending caps per workspace, per employee,
 * and per time period — critical for procurement approval and department
 * charge-back billing.
 *
 * GET  /api/workspaces/budgets?workspaceId= — list all budgets
 * POST /api/workspaces/budgets              — create or update a budget
 * DELETE /api/workspaces/budgets?budgetId=  — remove a budget
 *
 * Budget types:
 *   - workspace: aggregate cap for the entire workspace
 *   - employee: cap for a specific AI employee
 *   - member: cap for a specific human member
 *
 * Reset periods: daily, weekly, monthly, quarterly, annual, none (lifetime)
 *
 * When a budget is exceeded, requests are blocked and a 429 is returned
 * by the chat endpoint with Retry-After set to the next reset time.
 */

import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdminKey(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  return key === expected;
}

type BudgetType = "workspace" | "employee" | "member";
type ResetPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "none";
type BudgetAction = "block" | "warn" | "warn_and_block";

interface Budget {
  id: string;
  workspaceId: string;
  type: BudgetType;
  targetId?: string;
  limitUsd: number;
  currentSpendUsd: number;
  utilizationPct: number;
  resetPeriod: ResetPeriod;
  lastResetAt: string;
  nextResetAt?: string;
  action: BudgetAction;
  warningThresholdPct: number;
  alertEmails?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const VALID_TYPES: BudgetType[] = ["workspace", "employee", "member"];
const VALID_PERIODS: ResetPeriod[] = ["daily", "weekly", "monthly", "quarterly", "annual", "none"];
const VALID_ACTIONS: BudgetAction[] = ["block", "warn", "warn_and_block"];

function nextResetDate(period: ResetPeriod, from: Date): Date | undefined {
  if (period === "none") return undefined;
  const d = new Date(from);
  switch (period) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "annual":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const budgetId = url.searchParams.get("budgetId");
  const type = url.searchParams.get("type") as BudgetType | null;

  if (!workspaceId && !budgetId) {
    return Response.json({ error: "workspaceId or budgetId is required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  type Row = {
    id: string;
    workspace_id: string;
    type: string;
    target_id: string | null;
    limit_usd: number;
    current_spend_usd: number;
    reset_period: string;
    last_reset_at: string;
    next_reset_at: string | null;
    action: string;
    warning_threshold_pct: number;
    alert_emails: string[] | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };

  let rows: Row[];

  if (budgetId) {
    rows = (await neon`
      SELECT * FROM workspace_budgets WHERE id = ${budgetId} LIMIT 1
    `) as unknown as Row[];
    if (!rows.length) return Response.json({ error: "Budget not found" }, { status: 404 });
    return Response.json({ budget: formatBudget(rows[0]) });
  }

  rows = type
    ? ((await neon`
        SELECT * FROM workspace_budgets
        WHERE workspace_id = ${workspaceId!} AND type = ${type}
        ORDER BY created_at DESC
      `) as unknown as Row[])
    : ((await neon`
        SELECT * FROM workspace_budgets
        WHERE workspace_id = ${workspaceId!}
        ORDER BY type, created_at DESC
      `) as unknown as Row[]);

  const budgets = rows.map(formatBudget);

  // Compute workspace-level summary
  const totalBudget = budgets
    .filter((b) => b.type === "workspace" && b.isActive)
    .reduce((sum, b) => sum + b.limitUsd, 0);
  const totalSpend = budgets
    .filter((b) => b.type === "workspace" && b.isActive)
    .reduce((sum, b) => sum + b.currentSpendUsd, 0);

  return Response.json({
    budgets,
    summary: { totalBudgetUsd: totalBudget, totalSpendUsd: totalSpend },
  });
}

export async function POST(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    workspaceId?: string;
    type?: BudgetType;
    targetId?: string;
    limitUsd?: number;
    resetPeriod?: ResetPeriod;
    action?: BudgetAction;
    warningThresholdPct?: number;
    alertEmails?: string[];
    updateId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    workspaceId,
    type,
    limitUsd,
    resetPeriod = "monthly",
    action = "warn_and_block",
    warningThresholdPct = 80,
    alertEmails,
    updateId,
  } = body;

  if (!workspaceId || !type || limitUsd === undefined) {
    return Response.json(
      { error: "workspaceId, type, and limitUsd are required" },
      { status: 400 },
    );
  }

  if (!VALID_TYPES.includes(type)) {
    return Response.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 422 },
    );
  }
  if (!VALID_PERIODS.includes(resetPeriod)) {
    return Response.json(
      { error: `resetPeriod must be one of: ${VALID_PERIODS.join(", ")}` },
      { status: 422 },
    );
  }
  if (!VALID_ACTIONS.includes(action)) {
    return Response.json(
      { error: `action must be one of: ${VALID_ACTIONS.join(", ")}` },
      { status: 422 },
    );
  }
  if (limitUsd <= 0) {
    return Response.json({ error: "limitUsd must be positive" }, { status: 422 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  const now = new Date();
  const nextReset = nextResetDate(resetPeriod, now);
  const emails = Array.isArray(alertEmails) ? alertEmails : [];

  if (updateId) {
    await neon`
      UPDATE workspace_budgets
      SET limit_usd = ${limitUsd},
          reset_period = ${resetPeriod},
          next_reset_at = ${nextReset?.toISOString() ?? null},
          action = ${action},
          warning_threshold_pct = ${warningThresholdPct},
          alert_emails = ${JSON.stringify(emails)}::jsonb,
          updated_at = ${now.toISOString()}
      WHERE id = ${updateId} AND workspace_id = ${workspaceId}
    `;
    return Response.json({ id: updateId, updated: true });
  }

  const budgetId = `bgt_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
  await neon`
    INSERT INTO workspace_budgets (
      id, workspace_id, type, target_id, limit_usd, current_spend_usd,
      reset_period, last_reset_at, next_reset_at,
      action, warning_threshold_pct, alert_emails, is_active,
      created_at, updated_at
    ) VALUES (
      ${budgetId}, ${workspaceId}, ${type}, ${body.targetId ?? null},
      ${limitUsd}, 0,
      ${resetPeriod}, ${now.toISOString()}, ${nextReset?.toISOString() ?? null},
      ${action}, ${warningThresholdPct}, ${JSON.stringify(emails)}::jsonb, true,
      ${now.toISOString()}, ${now.toISOString()}
    )
  `;

  await neon`
    INSERT INTO audit_log (workspace_id, actor, action, target, payload)
    VALUES (${workspaceId}, 'api', 'budget.created', ${budgetId},
            ${JSON.stringify({ type, limitUsd, resetPeriod })}::jsonb)
  `.catch(() => {});

  return Response.json(
    {
      budget: {
        id: budgetId,
        workspaceId,
        type,
        targetId: body.targetId,
        limitUsd,
        currentSpendUsd: 0,
        utilizationPct: 0,
        resetPeriod,
        lastResetAt: now.toISOString(),
        nextResetAt: nextReset?.toISOString(),
        action,
        warningThresholdPct,
        alertEmails: emails,
        isActive: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      } satisfies Budget,
    },
    { status: 201 },
  );
}

export async function DELETE(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const budgetId = url.searchParams.get("budgetId");
  const workspaceId = url.searchParams.get("workspaceId");

  if (!budgetId || !workspaceId) {
    return Response.json({ error: "budgetId and workspaceId are required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  type Row = { id: string };
  const rows = (await neon`
    DELETE FROM workspace_budgets
    WHERE id = ${budgetId} AND workspace_id = ${workspaceId}
    RETURNING id
  `) as unknown as Row[];

  if (!rows.length) return Response.json({ error: "Budget not found" }, { status: 404 });

  return Response.json({ deleted: true, id: budgetId });
}

type RawBudgetRow = {
  id: string;
  workspace_id: string;
  type: string;
  target_id: string | null;
  limit_usd: number;
  current_spend_usd: number;
  reset_period: string;
  last_reset_at: string;
  next_reset_at: string | null;
  action: string;
  warning_threshold_pct: number;
  alert_emails: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function formatBudget(row: RawBudgetRow): Budget {
  const utilization =
    row.limit_usd > 0 ? Math.round((row.current_spend_usd / row.limit_usd) * 100) : 0;
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    type: row.type as BudgetType,
    targetId: row.target_id ?? undefined,
    limitUsd: row.limit_usd,
    currentSpendUsd: row.current_spend_usd,
    utilizationPct: utilization,
    resetPeriod: row.reset_period as ResetPeriod,
    lastResetAt: row.last_reset_at,
    nextResetAt: row.next_reset_at ?? undefined,
    action: row.action as BudgetAction,
    warningThresholdPct: row.warning_threshold_pct,
    alertEmails: row.alert_emails ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
