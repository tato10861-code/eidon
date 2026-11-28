/**
 * GET  /api/security/allowlist?workspaceId=ws_xxx   — fetch current IP allowlist
 * PUT  /api/security/allowlist                      — replace allowlist (owner only)
 * DELETE /api/security/allowlist                    — clear allowlist (unrestrict)
 */

import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import { validateAllowlist } from "@/lib/ip-allowlist";

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

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ workspaceId, allowlist: [], unrestricted: true });
  }

  type Row = { ip_allowlist: string[] | null };
  const rows = (await neon`
    SELECT ip_allowlist FROM workspaces WHERE id = ${workspaceId} LIMIT 1
  `) as unknown as Row[];

  if (!rows.length) {
    return Response.json({ error: "Workspace not found" }, { status: 404 });
  }

  const allowlist = rows[0].ip_allowlist ?? [];
  return Response.json({ workspaceId, allowlist, unrestricted: allowlist.length === 0 });
}

export async function PUT(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { workspaceId?: string; allowlist?: unknown[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workspaceId, allowlist } = body;
  if (!workspaceId || !Array.isArray(allowlist)) {
    return Response.json({ error: "workspaceId and allowlist[] are required" }, { status: 400 });
  }

  const { valid, errors } = validateAllowlist(allowlist);
  if (!valid) {
    return Response.json({ error: "Invalid allowlist entries", details: errors }, { status: 422 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  await neon`
    UPDATE workspaces SET ip_allowlist = ${JSON.stringify(allowlist)}::jsonb WHERE id = ${workspaceId}
  `;

  return Response.json({ ok: true, workspaceId, allowlist, unrestricted: allowlist.length === 0 });
}

export async function DELETE(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  await neon`UPDATE workspaces SET ip_allowlist = '[]'::jsonb WHERE id = ${workspaceId}`;

  return Response.json({ ok: true, workspaceId, allowlist: [], unrestricted: true });
}
