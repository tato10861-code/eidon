import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;
  const action = url.searchParams.get("action");

  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  type Row = {
    id: number;
    actor: string;
    action: string;
    target: string | null;
    payload: unknown;
    created_at: string;
  };
  type CountRow = { count: string };

  const [rows, totalRows] = await Promise.all([
    action
      ? (neon`
          SELECT id, actor, action, target, payload, created_at
          FROM audit_log
          WHERE workspace_id = ${workspaceId} AND action = ${action}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        ` as Promise<Row[]>)
      : (neon`
          SELECT id, actor, action, target, payload, created_at
          FROM audit_log
          WHERE workspace_id = ${workspaceId}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        ` as Promise<Row[]>),
    action
      ? (neon`SELECT count(*) FROM audit_log WHERE workspace_id = ${workspaceId} AND action = ${action}` as Promise<
          CountRow[]
        >)
      : (neon`SELECT count(*) FROM audit_log WHERE workspace_id = ${workspaceId}` as Promise<
          CountRow[]
        >),
  ]);

  const total = parseInt(totalRows[0]?.count ?? "0");
  return Response.json({
    events: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  let body: {
    workspaceId?: string;
    actor?: string;
    action?: string;
    target?: string;
    payload?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workspaceId, actor, action, target, payload } = body;
  if (!workspaceId || !action) {
    return Response.json({ error: "workspaceId and action are required" }, { status: 400 });
  }

  await neon`
    INSERT INTO audit_log (workspace_id, actor, action, target, payload)
    VALUES (${workspaceId}, ${actor ?? "api"}, ${action}, ${target ?? null},
            ${JSON.stringify(payload ?? {})}::jsonb)
  `;

  return Response.json({ ok: true }, { status: 201 });
}
