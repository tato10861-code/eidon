/**
 * Workspace invitation API.
 *
 * Enterprise teams manage membership through email invitations with
 * role-based access control.  Invitations are time-limited (7 days)
 * and can be revoked before acceptance.
 *
 * GET    /api/workspaces/invitations?workspaceId= — list invitations
 * POST   /api/workspaces/invitations              — create invitation
 * PATCH  /api/workspaces/invitations?token=       — accept invitation
 * DELETE /api/workspaces/invitations?id=&workspaceId= — revoke invitation
 */

import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import { randomBytes, randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdminKey(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  return key === expected;
}

type InvitationRole = "owner" | "admin" | "member" | "viewer";
type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

interface Invitation {
  id: string;
  workspaceId: string;
  email: string;
  role: InvitationRole;
  token?: string; // only returned to inviter on create
  status: InvitationStatus;
  invitedBy?: string;
  message?: string;
  acceptedBy?: string;
  acceptedAt?: string;
  expiresAt: string;
  revokedAt?: string;
  createdAt: string;
}

type Row = {
  id: string;
  workspace_id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  invited_by: string | null;
  message: string | null;
  accepted_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
};

function formatRow(r: Row, includeToken = false): Invitation {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    email: r.email,
    role: r.role as InvitationRole,
    ...(includeToken ? { token: r.token } : {}),
    status: r.status as InvitationStatus,
    invitedBy: r.invited_by ?? undefined,
    message: r.message ?? undefined,
    acceptedBy: r.accepted_by ?? undefined,
    acceptedAt: r.accepted_at ?? undefined,
    expiresAt: r.expires_at,
    revokedAt: r.revoked_at ?? undefined,
    createdAt: r.created_at,
  };
}

const VALID_ROLES: InvitationRole[] = ["owner", "admin", "member", "viewer"];
const INVITATION_TTL_DAYS = 7;

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const status = url.searchParams.get("status") ?? "pending";
  const email = url.searchParams.get("email");

  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  // Auto-expire stale invitations first
  await neon`
    UPDATE workspace_invitations
    SET status = 'expired'
    WHERE workspace_id = ${workspaceId}
      AND status = 'pending'
      AND expires_at < now()
  `.catch(() => {});

  let rows: Row[];
  if (email) {
    rows = (await neon`
      SELECT * FROM workspace_invitations
      WHERE workspace_id = ${workspaceId} AND email = ${email}
      ORDER BY created_at DESC LIMIT 20
    `) as unknown as Row[];
  } else {
    rows = (await neon`
      SELECT * FROM workspace_invitations
      WHERE workspace_id = ${workspaceId} AND status = ${status}
      ORDER BY created_at DESC LIMIT 100
    `) as unknown as Row[];
  }

  const invitations = rows.map((r) => formatRow(r, false));

  return Response.json({
    invitations,
    summary: {
      total: invitations.length,
      pending: invitations.filter((i) => i.status === "pending").length,
      accepted: invitations.filter((i) => i.status === "accepted").length,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    workspaceId?: string;
    email?: string;
    role?: InvitationRole;
    invitedBy?: string;
    message?: string;
    ttlDays?: number;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    workspaceId,
    email,
    role = "member",
    invitedBy,
    message,
    ttlDays = INVITATION_TTL_DAYS,
  } = body;

  if (!workspaceId || !email) {
    return Response.json({ error: "workspaceId and email are required" }, { status: 400 });
  }

  if (!VALID_ROLES.includes(role)) {
    return Response.json(
      { error: `role must be one of: ${VALID_ROLES.join(", ")}` },
      { status: 422 },
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return Response.json({ error: "Invalid email address" }, { status: 422 });
  }

  const neon = getNeon();
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  // Check for existing pending invitation for this email
  type ExistingRow = { id: string; expires_at: string };
  const existing = (await neon`
    SELECT id, expires_at FROM workspace_invitations
    WHERE workspace_id = ${workspaceId}
      AND email = ${email}
      AND status = 'pending'
      AND expires_at > now()
    LIMIT 1
  `) as unknown as ExistingRow[];

  if (existing.length) {
    return Response.json(
      {
        error: "A pending invitation for this email already exists",
        existingId: existing[0].id,
        expiresAt: existing[0].expires_at,
      },
      { status: 409 },
    );
  }

  const id = `inv_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const token = randomBytes(32).toString("hex"); // 64-char hex token
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

  await neon`
    INSERT INTO workspace_invitations (
      id, workspace_id, email, role, token, status,
      invited_by, message, expires_at, created_at
    ) VALUES (
      ${id}, ${workspaceId}, ${email}, ${role}, ${token}, 'pending',
      ${invitedBy ?? null}, ${message ?? null}, ${expiresAt}, ${now}
    )
  `;

  await neon`
    INSERT INTO audit_log (workspace_id, actor, action, target, payload)
    VALUES (${workspaceId}, ${invitedBy ?? "api"}, 'invitation.created', ${id},
            ${JSON.stringify({ email, role })}::jsonb)
  `.catch(() => {});

  const acceptUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://app.eidon.ai"}/invite/accept?token=${token}`;

  return Response.json(
    {
      invitation: {
        id,
        workspaceId,
        email,
        role,
        token,
        status: "pending",
        invitedBy,
        message,
        expiresAt,
        createdAt: now,
      } satisfies Invitation,
      acceptUrl,
    },
    { status: 201 },
  );
}

export async function PATCH(request: NextRequest) {
  // Accept invitation via token (no admin key required — public endpoint)
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return Response.json({ error: "token is required" }, { status: 400 });
  }

  let body: { userId?: string; displayName?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId } = body;
  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  type InvRow = {
    id: string;
    workspace_id: string;
    email: string;
    role: string;
    status: string;
    expires_at: string;
  };
  const rows = (await neon`
    SELECT id, workspace_id, email, role, status, expires_at
    FROM workspace_invitations
    WHERE token = ${token} LIMIT 1
  `) as unknown as InvRow[];

  if (!rows.length) {
    return Response.json({ error: "Invalid or expired invitation token" }, { status: 404 });
  }

  const inv = rows[0];

  if (inv.status !== "pending") {
    return Response.json(
      { error: `Invitation is ${inv.status} and cannot be accepted` },
      { status: 410 },
    );
  }

  if (new Date(inv.expires_at) < new Date()) {
    await neon`
      UPDATE workspace_invitations SET status = 'expired' WHERE id = ${inv.id}
    `.catch(() => {});
    return Response.json({ error: "Invitation has expired" }, { status: 410 });
  }

  const now = new Date().toISOString();

  // Create member record and mark invitation accepted — atomically
  await neon`
    UPDATE workspace_invitations
    SET status = 'accepted', accepted_by = ${userId}, accepted_at = ${now}
    WHERE id = ${inv.id}
  `;

  await neon`
    INSERT INTO members (workspace_id, user_id, role, created_at)
    VALUES (${inv.workspace_id}, ${userId}, ${inv.role}, ${now})
    ON CONFLICT (workspace_id, user_id) DO UPDATE
      SET role = EXCLUDED.role, created_at = members.created_at
  `.catch(() => {});

  await neon`
    INSERT INTO audit_log (workspace_id, actor, action, target, payload)
    VALUES (${inv.workspace_id}, ${userId}, 'invitation.accepted', ${inv.id},
            ${JSON.stringify({ email: inv.email, role: inv.role })}::jsonb)
  `.catch(() => {});

  return Response.json({
    accepted: true,
    workspaceId: inv.workspace_id,
    role: inv.role,
    email: inv.email,
  });
}

export async function DELETE(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const workspaceId = url.searchParams.get("workspaceId");

  if (!id || !workspaceId) {
    return Response.json({ error: "id and workspaceId are required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  const now = new Date().toISOString();

  type RevokeRow = { id: string; email: string; status: string };
  const rows = (await neon`
    UPDATE workspace_invitations
    SET status = 'revoked', revoked_at = ${now}
    WHERE id = ${id} AND workspace_id = ${workspaceId} AND status = 'pending'
    RETURNING id, email, status
  `) as unknown as RevokeRow[];

  if (!rows.length) {
    return Response.json(
      { error: "Invitation not found or is not in a pending state" },
      { status: 404 },
    );
  }

  return Response.json({ revoked: true, id, email: rows[0].email });
}
