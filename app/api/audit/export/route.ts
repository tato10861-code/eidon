/**
 * Audit log export endpoint.
 *
 * Enterprise buyers need:
 *   - Tamper-evident audit trails for SOC 2, ISO 27001, HIPAA compliance
 *   - Bulk export for SIEM integration (Splunk, Datadog, Elastic)
 *   - Date-range and actor/action filtering
 *   - JSON and NDJSON (newline-delimited JSON) formats for stream ingestion
 *
 * GET /api/audit/export
 *   ?workspaceId=   required
 *   &from=          ISO date (default: 30 days ago)
 *   &to=            ISO date (default: now)
 *   &actor=         filter by actor
 *   &action=        filter by action prefix (e.g. "security." matches all security.*)
 *   &target=        filter by target id
 *   &format=        "json" (default) | "ndjson"
 *   &limit=         max rows (default 1000, max 10000)
 *
 * Authentication: x-admin-key header
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

interface AuditEntry {
  id: number;
  workspaceId: string;
  actor: string;
  action: string;
  target?: string;
  payload: unknown;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const actor = url.searchParams.get("actor");
  const action = url.searchParams.get("action");
  const target = url.searchParams.get("target");
  const format = url.searchParams.get("format") ?? "json";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "1000", 10), 10_000);

  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  if (format !== "json" && format !== "ndjson") {
    return Response.json({ error: "format must be 'json' or 'ndjson'" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  // Build date range
  const fromDate = from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const toDate = to ?? new Date().toISOString();

  type Row = {
    id: number;
    workspace_id: string;
    actor: string;
    action: string;
    target: string | null;
    payload: unknown;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
  };

  let rows: Row[];

  // Build query conditionally based on filters
  if (actor && action && target) {
    rows = (await neon`
      SELECT id, workspace_id, actor, action, target, payload, ip_address, user_agent, created_at
      FROM audit_log
      WHERE workspace_id = ${workspaceId}
        AND created_at >= ${fromDate}
        AND created_at <= ${toDate}
        AND actor = ${actor}
        AND action LIKE ${action + "%"}
        AND target = ${target}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `) as unknown as Row[];
  } else if (actor && action) {
    rows = (await neon`
      SELECT id, workspace_id, actor, action, target, payload, ip_address, user_agent, created_at
      FROM audit_log
      WHERE workspace_id = ${workspaceId}
        AND created_at >= ${fromDate}
        AND created_at <= ${toDate}
        AND actor = ${actor}
        AND action LIKE ${action + "%"}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `) as unknown as Row[];
  } else if (actor) {
    rows = (await neon`
      SELECT id, workspace_id, actor, action, target, payload, ip_address, user_agent, created_at
      FROM audit_log
      WHERE workspace_id = ${workspaceId}
        AND created_at >= ${fromDate}
        AND created_at <= ${toDate}
        AND actor = ${actor}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `) as unknown as Row[];
  } else if (action) {
    rows = (await neon`
      SELECT id, workspace_id, actor, action, target, payload, ip_address, user_agent, created_at
      FROM audit_log
      WHERE workspace_id = ${workspaceId}
        AND created_at >= ${fromDate}
        AND created_at <= ${toDate}
        AND action LIKE ${action + "%"}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `) as unknown as Row[];
  } else {
    rows = (await neon`
      SELECT id, workspace_id, actor, action, target, payload, ip_address, user_agent, created_at
      FROM audit_log
      WHERE workspace_id = ${workspaceId}
        AND created_at >= ${fromDate}
        AND created_at <= ${toDate}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `) as unknown as Row[];
  }

  const entries: AuditEntry[] = rows.map((r) => ({
    id: r.id,
    workspaceId: r.workspace_id,
    actor: r.actor,
    action: r.action,
    target: r.target ?? undefined,
    payload: r.payload,
    ipAddress: r.ip_address ?? undefined,
    userAgent: r.user_agent ?? undefined,
    createdAt: r.created_at,
  }));

  const headers: HeadersInit = {
    "Cache-Control": "no-store",
    "X-Audit-Count": String(entries.length),
    "X-Audit-From": fromDate,
    "X-Audit-To": toDate,
  };

  if (format === "ndjson") {
    const ndjson = entries.map((e) => JSON.stringify(e)).join("\n");
    return new Response(ndjson, {
      headers: {
        ...headers,
        "Content-Type": "application/x-ndjson",
        "Content-Disposition": `attachment; filename="audit-${workspaceId}-${Date.now()}.ndjson"`,
      },
    });
  }

  return Response.json(
    {
      workspaceId,
      from: fromDate,
      to: toDate,
      count: entries.length,
      entries,
    },
    { headers },
  );
}
