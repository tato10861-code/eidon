import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import { getSupabase } from "@/lib/supabase";
import { getProvider } from "@/lib/oauth";
import { accessError, authorizeWorkspace, authenticateRequest } from "@/lib/auth/authorization";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!getProvider(provider)) return Response.json({ error: "Unknown provider." }, { status: 404 });
  const workspaceId = request.nextUrl.searchParams.get("workspaceId")?.trim();
  if (!workspaceId) return Response.json({ error: "workspaceId is required." }, { status: 400 });

  try {
    await authorizeWorkspace(request, workspaceId, "admin");
  } catch (error) {
    return accessError(error);
  }

  const principal = await authenticateRequest(request);

  try {
    const supabase = await getSupabase();
    if (supabase) {
      const { error } = await supabase
        .from("integration_credentials")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("provider", provider);
      if (error) throw error;
    } else {
      const sql = getNeon();
      if (!sql) return Response.json({ error: "Database not configured." }, { status: 503 });
      await sql`
        delete from integration_credentials
        where workspace_id = ${workspaceId} and provider = ${provider}
      `;
    }
    await writeAudit({
      workspaceId,
      actor: principal.subject,
      actorType: principal.kind === "session" ? "session" : "api_key",
      action: "oauth.disconnected",
      target: provider,
      outcome: "executed",
    });
    return Response.json({ disconnected: true, provider, workspaceId });
  } catch {
    return Response.json({ error: "Could not disconnect OAuth integration." }, { status: 503 });
  }
}
