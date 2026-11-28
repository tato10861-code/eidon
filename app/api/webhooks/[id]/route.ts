import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || !id.startsWith("wh_")) {
    return Response.json({ error: "Invalid webhook ID." }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return new Response(null, { status: 204 });
  }

  const rows = (await neon`DELETE FROM webhooks WHERE id = ${id} RETURNING id`) as { id: string }[];
  if (!rows || rows.length === 0) {
    return Response.json({ error: "Webhook not found." }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { active?: boolean };

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not configured." }, { status: 503 });
  }

  if (typeof body.active === "boolean") {
    const rows = (await neon`
      UPDATE webhooks SET active = ${body.active} WHERE id = ${id} RETURNING id, url, events, active
    `) as { id: string; url: string; events: string[]; active: boolean }[];
    if (!rows || rows.length === 0) {
      return Response.json({ error: "Webhook not found." }, { status: 404 });
    }
    return Response.json(rows[0]);
  }

  return Response.json({ error: "Nothing to update." }, { status: 400 });
}
