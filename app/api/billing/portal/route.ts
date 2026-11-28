import type { NextRequest } from "next/server";
import { createPortalSession } from "@/lib/billing";
import { getNeon } from "@/lib/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { workspaceId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workspaceId } = body;
  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  type Row = { stripe_customer_id: string | null };
  const rows =
    (await neon`SELECT stripe_customer_id FROM workspaces WHERE id = ${workspaceId}`) as Row[];
  const customerId = rows[0]?.stripe_customer_id;
  if (!customerId) {
    return Response.json({ error: "No billing account found for this workspace" }, { status: 404 });
  }

  const origin = request.headers.get("origin") ?? "https://eidon.ai";
  const session = await createPortalSession({
    customerId,
    returnUrl: `${origin}/settings/billing`,
  });

  return Response.json({ url: session.url });
}
