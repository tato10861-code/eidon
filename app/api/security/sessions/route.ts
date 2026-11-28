/**
 * GET    /api/security/sessions?workspaceId=ws_xxx   — list active sessions
 * DELETE /api/security/sessions/:id                  — revoke a session
 * DELETE /api/security/sessions?workspaceId=&all=1   — revoke all sessions in workspace
 *
 * Enterprise "force logout" / session management endpoint.
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

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const userId = url.searchParams.get("userId");

  const neon = getNeon();
  if (!neon) {
    return Response.json({ sessions: [], total: 0 });
  }

  type Row = {
    id: string;
    user_id: string;
    workspace_id: string;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    last_active_at: string;
    expires_at: string;
  };

  let rows: Row[];
  if (workspaceId && userId) {
    rows = (await neon`
      SELECT id, user_id, workspace_id, ip_address, user_agent, created_at, last_active_at, expires_at
      FROM sessions
      WHERE workspace_id = ${workspaceId} AND user_id = ${userId}
        AND revoked_at IS NULL AND expires_at > now()
      ORDER BY last_active_at DESC
    `) as unknown as Row[];
  } else if (workspaceId) {
    rows = (await neon`
      SELECT id, user_id, workspace_id, ip_address, user_agent, created_at, last_active_at, expires_at
      FROM sessions
      WHERE workspace_id = ${workspaceId}
        AND revoked_at IS NULL AND expires_at > now()
      ORDER BY last_active_at DESC
      LIMIT 200
    `) as unknown as Row[];
  } else {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  return Response.json({ sessions: rows, total: rows.length });
}

export async function DELETE(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const sessionId = url.searchParams.get("sessionId");
  const all = url.searchParams.get("all") === "1";
  const userId = url.searchParams.get("userId");

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const revokedAt = new Date().toISOString();

  if (sessionId) {
    await neon`UPDATE sessions SET revoked_at = ${revokedAt} WHERE id = ${sessionId}`;
    return Response.json({ ok: true, revoked: 1 });
  }

  if (all && workspaceId) {
    type CountRow = { n: string };
    const filter = userId
      ? ((await neon`
          UPDATE sessions SET revoked_at = ${revokedAt}
          WHERE workspace_id = ${workspaceId} AND user_id = ${userId} AND revoked_at IS NULL
          RETURNING id
        `) as unknown as { id: string }[])
      : ((await neon`
          UPDATE sessions SET revoked_at = ${revokedAt}
          WHERE workspace_id = ${workspaceId} AND revoked_at IS NULL
          RETURNING id
        `) as unknown as { id: string }[]);

    return Response.json({ ok: true, revoked: filter.length });
  }

  return Response.json({ error: "Provide sessionId, or workspaceId with all=1" }, { status: 400 });
}
