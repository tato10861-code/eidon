/**
 * Workspace member management with RBAC enforcement.
 *
 * GET    /api/workspaces/members?workspaceId=  — list members
 * POST   /api/workspaces/members               — invite a member
 * PATCH  /api/workspaces/members               — change role
 * DELETE /api/workspaces/members               — remove a member
 */

import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import { isValidRole, type WorkspaceRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdminKey(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  return key === expected;
}

/** GET /api/workspaces/members?workspaceId=&page=&limit= */
export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "25", 10)));
  const offset = (page - 1) * limit;

  const neon = getNeon();
  if (!neon) {
    return Response.json({ members: [], pagination: { page, limit, total: 0, pages: 0 } });
  }

  type Row = {
    id: string;
    user_id: string;
    email: string;
    role: WorkspaceRole;
    joined_at: string | null;
    created_at: string;
  };
  type CountRow = { n: string };

  const [rows, countRows] = await Promise.all([
    neon`
      SELECT id, user_id, email, role, joined_at, created_at
      FROM workspace_members
      WHERE workspace_id = ${workspaceId}
      ORDER BY created_at
      LIMIT ${limit} OFFSET ${offset}
    ` as unknown as Promise<Row[]>,
    neon`SELECT count(*) AS n FROM workspace_members WHERE workspace_id = ${workspaceId}` as unknown as Promise<
      CountRow[]
    >,
  ]);

  const total = parseInt(countRows[0]?.n ?? "0", 10);

  return Response.json({
    members: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

/** POST /api/workspaces/members — invite a user */
export async function POST(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    workspaceId?: string;
    email?: string;
    role?: string;
    invitedBy?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workspaceId, email, role = "member", invitedBy } = body;
  if (!workspaceId || !email) {
    return Response.json({ error: "workspaceId and email are required" }, { status: 400 });
  }
  if (!isValidRole(role)) {
    return Response.json(
      { error: `Invalid role. Must be one of: owner, admin, member, viewer` },
      { status: 422 },
    );
  }
  if (role === "owner") {
    return Response.json({ error: "Cannot invite additional owners" }, { status: 422 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  type ExistRow = { id: string };
  const existing = (await neon`
    SELECT id FROM workspace_members WHERE workspace_id = ${workspaceId} AND email = ${email} LIMIT 1
  `) as unknown as ExistRow[];

  if (existing.length > 0) {
    return Response.json({ error: "Member already exists" }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await neon`
    INSERT INTO workspace_members (id, workspace_id, email, role, invited_by, created_at)
    VALUES (${id}, ${workspaceId}, ${email}, ${role}, ${invitedBy ?? null}, ${now})
  `;

  // Audit
  try {
    await neon`
      INSERT INTO audit_log (workspace_id, actor, action, target, payload)
      VALUES (${workspaceId}, ${invitedBy ?? "api"}, 'member.invited', ${email},
              ${JSON.stringify({ role })}::jsonb)
    `;
  } catch {
    /* non-fatal */
  }

  return Response.json({ id, workspaceId, email, role, createdAt: now }, { status: 201 });
}

/** PATCH /api/workspaces/members — change a member's role */
export async function PATCH(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    workspaceId?: string;
    memberId?: string;
    role?: string;
    changedBy?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workspaceId, memberId, role, changedBy } = body;
  if (!workspaceId || !memberId || !role) {
    return Response.json(
      { error: "workspaceId, memberId, and role are required" },
      { status: 400 },
    );
  }
  if (!isValidRole(role)) {
    return Response.json({ error: "Invalid role" }, { status: 422 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  await neon`
    UPDATE workspace_members SET role = ${role}
    WHERE id = ${memberId} AND workspace_id = ${workspaceId}
  `;

  try {
    await neon`
      INSERT INTO audit_log (workspace_id, actor, action, target, payload)
      VALUES (${workspaceId}, ${changedBy ?? "api"}, 'member.role_changed', ${memberId},
              ${JSON.stringify({ role })}::jsonb)
    `;
  } catch {
    /* non-fatal */
  }

  return Response.json({ ok: true, memberId, role });
}

/** DELETE /api/workspaces/members — remove a member */
export async function DELETE(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const memberId = url.searchParams.get("memberId");
  const removedBy = url.searchParams.get("removedBy");

  if (!workspaceId || !memberId) {
    return Response.json({ error: "workspaceId and memberId are required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  type Row = { email: string; role: WorkspaceRole };
  const rows = (await neon`
    SELECT email, role FROM workspace_members WHERE id = ${memberId} AND workspace_id = ${workspaceId} LIMIT 1
  `) as unknown as Row[];

  if (!rows.length) {
    return Response.json({ error: "Member not found" }, { status: 404 });
  }
  if (rows[0].role === "owner") {
    return Response.json({ error: "Cannot remove the workspace owner" }, { status: 403 });
  }

  await neon`DELETE FROM workspace_members WHERE id = ${memberId} AND workspace_id = ${workspaceId}`;

  try {
    await neon`
      INSERT INTO audit_log (workspace_id, actor, action, target, payload)
      VALUES (${workspaceId}, ${removedBy ?? "api"}, 'member.removed', ${rows[0].email},
              ${JSON.stringify({ role: rows[0].role })}::jsonb)
    `;
  } catch {
    /* non-fatal */
  }

  return Response.json({ ok: true });
}
