/**
 * Workspace usage analytics API.
 *
 * Returns token consumption, cost, and request volume with daily/weekly/
 * monthly time-series granularity for dashboard charting.
 *
 * GET /api/workspaces/usage?workspaceId=&period=30d  — time-series analytics
 * POST /api/workspaces/usage                         — record a usage event
 *
 * Query params:
 *   workspaceId  required
 *   period       7d | 30d | 90d | 1y  (default: 30d)
 *   granularity  day | week | month    (default: day)
 *   employeeId   filter by employee
 *   model        filter by model
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

type Period = "7d" | "30d" | "90d" | "1y";
type Granularity = "day" | "week" | "month";

const PERIOD_DAYS: Record<Period, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };

type UsageEventType = "completion" | "embedding" | "moderation" | "fine_tune" | "tool_call";

interface UsageEvent {
  workspaceId: string;
  employeeId?: string;
  conversationId?: string;
  userId?: string;
  model: string;
  eventType?: UsageEventType;
  promptTokens: number;
  completionTokens: number;
  costUsd?: number;
  latencyMs?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const period = (url.searchParams.get("period") ?? "30d") as Period;
  const granularity = (url.searchParams.get("granularity") ?? "day") as Granularity;
  const employeeId = url.searchParams.get("employeeId");
  const model = url.searchParams.get("model");

  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  if (!PERIOD_DAYS[period]) {
    return Response.json({ error: "period must be one of: 7d, 30d, 90d, 1y" }, { status: 422 });
  }

  const neon = getNeon();
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  const days = PERIOD_DAYS[period];
  const truncUnit = granularity === "week" ? "week" : granularity === "month" ? "month" : "day";

  // Build filters dynamically
  const empFilter = employeeId ? neon`AND employee_id = ${employeeId}` : neon``;
  const modelFilter = model ? neon`AND model = ${model}` : neon``;

  type TimeSeriesRow = {
    bucket: string;
    request_count: string;
    prompt_tokens: string;
    completion_tokens: string;
    total_tokens: string;
    cost_usd: string;
    avg_latency_ms: string | null;
    error_count: string;
  };

  type SummaryRow = {
    request_count: string;
    prompt_tokens: string;
    completion_tokens: string;
    total_tokens: string;
    cost_usd: string;
    avg_latency_ms: string | null;
    error_count: string;
  };

  type ModelRow = {
    model: string;
    request_count: string;
    total_tokens: string;
    cost_usd: string;
  };

  type EmployeeRow = {
    employee_id: string | null;
    request_count: string;
    total_tokens: string;
    cost_usd: string;
  };

  const [timeSeries, summary, byModel, byEmployee] = await Promise.all([
    // Time-series bucketed data
    (
      neon`
      SELECT
        DATE_TRUNC(${truncUnit}, created_at) AS bucket,
        COUNT(*)::text AS request_count,
        SUM(prompt_tokens)::text AS prompt_tokens,
        SUM(completion_tokens)::text AS completion_tokens,
        SUM(total_tokens)::text AS total_tokens,
        SUM(cost_usd)::text AS cost_usd,
        AVG(latency_ms)::text AS avg_latency_ms,
        COUNT(*) FILTER (WHERE error IS NOT NULL)::text AS error_count
      FROM usage_events
      WHERE workspace_id = ${workspaceId}
        AND created_at >= now() - (${days} || ' days')::interval
        ${empFilter}
        ${modelFilter}
      GROUP BY bucket
      ORDER BY bucket ASC
    ` as Promise<unknown[]>
    ).catch(() => []),

    // Aggregate summary for the period
    (
      neon`
      SELECT
        COUNT(*)::text AS request_count,
        SUM(prompt_tokens)::text AS prompt_tokens,
        SUM(completion_tokens)::text AS completion_tokens,
        SUM(total_tokens)::text AS total_tokens,
        SUM(cost_usd)::text AS cost_usd,
        AVG(latency_ms)::text AS avg_latency_ms,
        COUNT(*) FILTER (WHERE error IS NOT NULL)::text AS error_count
      FROM usage_events
      WHERE workspace_id = ${workspaceId}
        AND created_at >= now() - (${days} || ' days')::interval
        ${empFilter}
        ${modelFilter}
    ` as Promise<unknown[]>
    ).catch(() => []),

    // Breakdown by model
    (
      neon`
      SELECT
        model,
        COUNT(*)::text AS request_count,
        SUM(total_tokens)::text AS total_tokens,
        SUM(cost_usd)::text AS cost_usd
      FROM usage_events
      WHERE workspace_id = ${workspaceId}
        AND created_at >= now() - (${days} || ' days')::interval
      GROUP BY model
      ORDER BY SUM(cost_usd) DESC
      LIMIT 20
    ` as Promise<unknown[]>
    ).catch(() => []),

    // Breakdown by employee (top 20)
    (
      neon`
      SELECT
        employee_id,
        COUNT(*)::text AS request_count,
        SUM(total_tokens)::text AS total_tokens,
        SUM(cost_usd)::text AS cost_usd
      FROM usage_events
      WHERE workspace_id = ${workspaceId}
        AND created_at >= now() - (${days} || ' days')::interval
      GROUP BY employee_id
      ORDER BY SUM(cost_usd) DESC
      LIMIT 20
    ` as Promise<unknown[]>
    ).catch(() => []),
  ]);

  const ts = timeSeries as TimeSeriesRow[];
  const sm = (summary as SummaryRow[])[0];
  const bm = byModel as ModelRow[];
  const be = byEmployee as EmployeeRow[];

  return Response.json({
    workspaceId,
    period,
    granularity,
    filters: { employeeId, model },
    summary: sm
      ? {
          requestCount: parseInt(sm.request_count ?? "0"),
          promptTokens: parseInt(sm.prompt_tokens ?? "0"),
          completionTokens: parseInt(sm.completion_tokens ?? "0"),
          totalTokens: parseInt(sm.total_tokens ?? "0"),
          costUsd: parseFloat(sm.cost_usd ?? "0"),
          avgLatencyMs: sm.avg_latency_ms ? parseFloat(sm.avg_latency_ms) : null,
          errorCount: parseInt(sm.error_count ?? "0"),
          errorRate:
            parseInt(sm.request_count ?? "0") > 0
              ? parseInt(sm.error_count ?? "0") / parseInt(sm.request_count)
              : 0,
        }
      : null,
    timeSeries: ts.map((r) => ({
      bucket: r.bucket,
      requestCount: parseInt(r.request_count ?? "0"),
      promptTokens: parseInt(r.prompt_tokens ?? "0"),
      completionTokens: parseInt(r.completion_tokens ?? "0"),
      totalTokens: parseInt(r.total_tokens ?? "0"),
      costUsd: parseFloat(r.cost_usd ?? "0"),
      avgLatencyMs: r.avg_latency_ms ? parseFloat(r.avg_latency_ms) : null,
      errorCount: parseInt(r.error_count ?? "0"),
    })),
    byModel: bm.map((r) => ({
      model: r.model,
      requestCount: parseInt(r.request_count ?? "0"),
      totalTokens: parseInt(r.total_tokens ?? "0"),
      costUsd: parseFloat(r.cost_usd ?? "0"),
    })),
    byEmployee: be.map((r) => ({
      employeeId: r.employee_id,
      requestCount: parseInt(r.request_count ?? "0"),
      totalTokens: parseInt(r.total_tokens ?? "0"),
      costUsd: parseFloat(r.cost_usd ?? "0"),
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: UsageEvent | UsageEvent[];
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const events = Array.isArray(body) ? body : [body];

  if (events.length > 1000) {
    return Response.json({ error: "Maximum 1000 events per batch" }, { status: 413 });
  }

  for (const ev of events) {
    if (!ev.workspaceId || !ev.model) {
      return Response.json({ error: "Each event requires workspaceId and model" }, { status: 400 });
    }
  }

  const neon = getNeon();
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  const now = new Date().toISOString();
  let inserted = 0;

  // Insert in batches of 100
  for (let i = 0; i < events.length; i += 100) {
    const batch = events.slice(i, i + 100);
    for (const ev of batch) {
      const totalTokens = (ev.promptTokens ?? 0) + (ev.completionTokens ?? 0);
      await neon`
        INSERT INTO usage_events (
          workspace_id, employee_id, conversation_id, user_id,
          model, event_type, prompt_tokens, completion_tokens, total_tokens,
          cost_usd, latency_ms, error, metadata, created_at
        ) VALUES (
          ${ev.workspaceId}, ${ev.employeeId ?? null}, ${ev.conversationId ?? null},
          ${ev.userId ?? null}, ${ev.model}, ${ev.eventType ?? "completion"},
          ${ev.promptTokens ?? 0}, ${ev.completionTokens ?? 0}, ${totalTokens},
          ${ev.costUsd ?? 0}, ${ev.latencyMs ?? null}, ${ev.error ?? null},
          ${JSON.stringify(ev.metadata ?? {})}::jsonb, ${now}
        )
      `;
      inserted++;
    }
  }

  return Response.json({ inserted, total: events.length }, { status: 201 });
}
