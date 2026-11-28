import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import { accessError, authorizeWorkspace } from "@/lib/auth/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function getOwnedWebhook(request: NextRequest, id: string) {
  const neon = getNeon();
  if (!neon) return { neon: null, workspaceId: "demo" };
  const rows = (await neon`SELECT workspace_id FROM webhooks WHERE id = ${id} LIMIT 1`) as {
    workspace_id: string;
  }[];
  if (!rows[0]?.workspace_id) return { neon, workspaceId: null };
  try {
    await authorizeWorkspace(request, rows[0].workspace_id, "admin");
  } catch (error) {
    return { neon, workspaceId: null, error };
  }
  return { neon, workspaceId: rows[0].workspace_id };
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!id || !id.startsWith("wh_"))
    return Response.json({ error: "Invalid webhook ID." }, { status: 400 });
  const owned = await getOwnedWebhook(request, id);
  if (owned.error) return accessError(owned.error);
  if (!owned.workspaceId) return Response.json({ error: "Webhook not found." }, { status: 404 });
  if (!owned.neon) return new Response(null, { status: 204 });
  const rows =
    (await owned.neon`DELETE FROM webhooks WHERE id = ${id} AND workspace_id = ${owned.workspaceId} RETURNING id`) as {
      id: string;
    }[];
  if (!rows.length) return Response.json({ error: "Webhook not found." }, { status: 404 });
  return new Response(null, { status: 204 });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!id || !id.startsWith("wh_"))
    return Response.json({ error: "Invalid webhook ID." }, { status: 400 });
  const body = (await request.json().catch(() => ({}))) as { active?: boolean };
  const owned = await getOwnedWebhook(request, id);
  if (owned.error) return accessError(owned.error);
  if (!owned.workspaceId) return Response.json({ error: "Webhook not found." }, { status: 404 });
  if (!owned.neon) return Response.json({ error: "Database not configured." }, { status: 503 });
  if (typeof body.active !== "boolean")
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  const rows = (await owned.neon`
    UPDATE webhooks SET active = ${body.active}, updated_at = now()
    WHERE id = ${id} AND workspace_id = ${owned.workspaceId}
    RETURNING id, url, events, active
  `) as { id: string; url: string; events: string[]; active: boolean }[];
  if (!rows.length) return Response.json({ error: "Webhook not found." }, { status: 404 });
  return Response.json(rows[0]);
}
