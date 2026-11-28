/**
 * Analytics & usage metrics endpoint.
 *
 * GET /api/analytics?workspaceId=&period=  — workspace usage summary
 * GET /api/analytics?workspaceId=&period=&breakdown=employee — per-employee stats
 * GET /api/analytics?workspaceId=&period=&breakdown=model   — per-model stats
 *
 * period: "7d" | "30d" | "90d" | "1y"  (default: "30d")
 *
 * Returns metrics useful for enterprise dashboards:
 *   - total conversations, messages, tokens
 *   - active employees count
 *   - cost estimation (based on model token pricing)
 *   - daily series for trend charts
 */

import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdminKey(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  return key === expected;
}

type Period = "7d" | "30d" | "90d" | "1y";

function periodToDays(p: Period): number {
  return { "7d": 7, "30d": 30, "90d": 90, "1y": 365 }[p];
}

/** Approximate cost per million tokens for each model tier. */
const MODEL_COST_PER_1M: Record<string, { input: number; output: number }> = {
  "claude-opus": { input: 15, output: 75 },
  "claude-sonnet": { input: 3, output: 15 },
  "claude-haiku": { input: 0.25, output: 1.25 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gemini-pro": { input: 1.25, output: 5 },
  default: { input: 3, output: 15 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const key =
    Object.keys(MODEL_COST_PER_1M).find((k) => model.toLowerCase().includes(k)) ?? "default";
  const pricing = MODEL_COST_PER_1M[key];
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const period = (url.searchParams.get("period") ?? "30d") as Period;
  const breakdown = url.searchParams.get("breakdown") as "employee" | "model" | null;

  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  if (!["7d", "30d", "90d", "1y"].includes(period)) {
    return Response.json({ error: "period must be 7d, 30d, 90d, or 1y" }, { status: 400 });
  }

  const days = periodToDays(period);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const neon = getNeon();
  if (!neon) {
    return Response.json({
      workspaceId,
      period,
      summary: {
        totalConversations: 0,
        totalMessages: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
        activeEmployees: 0,
      },
      series: [],
      breakdown: null,
    });
  }

  type SummaryRow = {
    conversations: string;
    messages: string;
    input_tokens: string;
    output_tokens: string;
  };
  const [summaryRows] = await Promise.all([
    neon`
      SELECT
        COUNT(DISTINCT c.id) AS conversations,
        COUNT(m.id)          AS messages,
        COALESCE(SUM(CASE WHEN m.role = 'user' THEN LENGTH(m.content) / 4 ELSE 0 END), 0) AS input_tokens,
        COALESCE(SUM(CASE WHEN m.role = 'assistant' THEN LENGTH(m.content) / 4 ELSE 0 END), 0) AS output_tokens
      FROM conversations c
      LEFT JOIN messages m ON m.conversation_id = c.id
      WHERE c.workspace_id = ${workspaceId}
        AND c.created_at >= ${since}
    ` as unknown as Promise<SummaryRow[]>,
  ]);

  const s = summaryRows[0] ?? {
    conversations: "0",
    messages: "0",
    input_tokens: "0",
    output_tokens: "0",
  };
  const inputTokens = parseInt(s.input_tokens);
  const outputTokens = parseInt(s.output_tokens);

  // Active employees
  type ActiveRow = { n: string };
  const activeRows = (await neon`
    SELECT COUNT(DISTINCT employee_id) AS n
    FROM conversations
    WHERE workspace_id = ${workspaceId}
      AND employee_id IS NOT NULL
      AND created_at >= ${since}
  `) as unknown as ActiveRow[];

  // Daily series
  type DayRow = { day: string; conversations: string; messages: string };
  const seriesRows = (await neon`
    SELECT
      DATE_TRUNC('day', c.created_at)::date::text AS day,
      COUNT(DISTINCT c.id) AS conversations,
      COUNT(m.id)          AS messages
    FROM conversations c
    LEFT JOIN messages m ON m.conversation_id = c.id
    WHERE c.workspace_id = ${workspaceId}
      AND c.created_at >= ${since}
    GROUP BY 1 ORDER BY 1
  `) as unknown as DayRow[];

  let breakdownData = null;

  if (breakdown === "employee") {
    type EmpRow = {
      employee_id: string;
      name: string | null;
      conversations: string;
      messages: string;
    };
    breakdownData = (await neon`
      SELECT
        c.employee_id,
        e.name,
        COUNT(DISTINCT c.id) AS conversations,
        COUNT(m.id)          AS messages
      FROM conversations c
      LEFT JOIN employees e ON e.id = c.employee_id
      LEFT JOIN messages m  ON m.conversation_id = c.id
      WHERE c.workspace_id = ${workspaceId}
        AND c.created_at >= ${since}
        AND c.employee_id IS NOT NULL
      GROUP BY c.employee_id, e.name
      ORDER BY conversations DESC
      LIMIT 20
    `) as unknown as EmpRow[];
  }

  if (breakdown === "model") {
    type ModelRow = { model: string | null; conversations: string };
    const modelRows = (await neon`
      SELECT model, COUNT(*) AS conversations
      FROM conversations
      WHERE workspace_id = ${workspaceId}
        AND created_at >= ${since}
      GROUP BY model ORDER BY conversations DESC
      LIMIT 20
    `) as unknown as ModelRow[];

    breakdownData = modelRows.map((r) => ({
      model: r.model ?? "unknown",
      conversations: parseInt(r.conversations),
      estimatedCostUsd: estimateCost(r.model ?? "", 0, 0),
    }));
  }

  return Response.json({
    workspaceId,
    period,
    since,
    summary: {
      totalConversations: parseInt(s.conversations),
      totalMessages: parseInt(s.messages),
      totalInputTokens: inputTokens,
      totalOutputTokens: outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCostUsd: parseFloat(
        estimateCost("claude-sonnet", inputTokens, outputTokens).toFixed(4),
      ),
      activeEmployees: parseInt(activeRows[0]?.n ?? "0"),
    },
    series: seriesRows.map((r) => ({
      day: r.day,
      conversations: parseInt(r.conversations),
      messages: parseInt(r.messages),
    })),
    breakdown: breakdownData,
  });
}
