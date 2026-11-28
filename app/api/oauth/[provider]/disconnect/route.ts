import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import { getSupabase } from "@/lib/supabase";
import { getProvider } from "@/lib/oauth";
import { accessError, authorizeWorkspace, authenticateRequest } from "@/lib/auth/authorization";
import { writeAudit } from "@/lib/audit";
import { decryptSecret } from "@/lib/security/secrets";
import { revokeOAuthToken } from "@/lib/oauth-revocation";

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
    let encryptedAccessToken: string | null = null;
    let encryptedRefreshToken: string | null = null;
    if (supabase) {
      const { data, error } = await supabase
        .from("integration_credentials")
        .select("access_token_encrypted, refresh_token_encrypted")
        .eq("workspace_id", workspaceId)
        .eq("provider", provider)
        .maybeSingle();
      if (error) throw error;
      encryptedAccessToken = data?.access_token_encrypted ?? null;
      encryptedRefreshToken = data?.refresh_token_encrypted ?? null;
    } else {
      const sql = getNeon();
      if (!sql) return Response.json({ error: "Database not configured." }, { status: 503 });
      const rows = (await sql`
        select access_token_encrypted, refresh_token_encrypted
        from integration_credentials
        where workspace_id = ${workspaceId} and provider = ${provider}
        limit 1
      `) as { access_token_encrypted?: string; refresh_token_encrypted?: string | null }[];
      encryptedAccessToken = rows[0]?.access_token_encrypted ?? null;
      encryptedRefreshToken = rows[0]?.refresh_token_encrypted ?? null;
    }

    if (encryptedRefreshToken) {
      const result = await revokeOAuthToken(
        provider,
        decryptSecret(encryptedRefreshToken),
        "refresh",
      );
      if (!result.supported)
        throw new Error("OAuth provider does not support refresh-token revocation");
    } else if (encryptedAccessToken) {
      const result = await revokeOAuthToken(
        provider,
        decryptSecret(encryptedAccessToken),
        "access",
      );
      if (!result.supported)
        throw new Error("OAuth provider does not support access-token revocation");
    }

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
  } catch (error) {
    await writeAudit({
      workspaceId,
      actor: principal.subject,
      actorType: principal.kind === "session" ? "session" : "api_key",
      action: "oauth.revocation_failed",
      target: provider,
      outcome: "failed",
      payload: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json(
      { error: "OAuth provider revocation failed; the local credential was retained." },
      { status: 502 },
    );
  }
}
