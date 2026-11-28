import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import { getSupabase } from "@/lib/supabase";
import { getProvider } from "@/lib/oauth";
import { decryptSecret, encryptSecret } from "@/lib/security/secrets";
import { accessError, authorizeWorkspace, authenticateRequest } from "@/lib/auth/authorization";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoredCredential = {
  refresh_token_encrypted?: string | null;
  scopes?: string[] | null;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;
  const provider = getProvider(providerId);
  if (!provider) return Response.json({ error: "Unknown provider." }, { status: 404 });
  const workspaceId = request.nextUrl.searchParams.get("workspaceId")?.trim();
  if (!workspaceId) return Response.json({ error: "workspaceId is required." }, { status: 400 });

  try {
    await authorizeWorkspace(request, workspaceId, "admin");
  } catch (error) {
    return accessError(error);
  }
  const principal = await authenticateRequest(request);
  if (!process.env.EIDON_TOKEN_ENCRYPTION_KEY || !process.env[provider.clientIdEnv]) {
    return Response.json({ error: "OAuth token rotation is not configured." }, { status: 503 });
  }

  try {
    const supabase = await getSupabase();
    let stored: StoredCredential | null = null;
    if (supabase) {
      const { data, error } = await supabase
        .from("integration_credentials")
        .select("refresh_token_encrypted, scopes")
        .eq("workspace_id", workspaceId)
        .eq("provider", providerId)
        .maybeSingle();
      if (error) throw error;
      stored = data;
    } else {
      const sql = getNeon();
      if (!sql) return Response.json({ error: "Database not configured." }, { status: 503 });
      const rows = await sql`
        select refresh_token_encrypted, scopes
        from integration_credentials
        where workspace_id = ${workspaceId} and provider = ${providerId}
        limit 1
      `;
      stored = (rows as StoredCredential[])[0] ?? null;
    }
    if (!stored?.refresh_token_encrypted) {
      return Response.json(
        { error: "No refresh token is stored for this integration." },
        { status: 409 },
      );
    }

    const refreshToken = decryptSecret(stored.refresh_token_encrypted);
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env[provider.clientIdEnv] ?? "",
      client_secret: process.env[provider.clientSecretEnv] ?? "",
    });
    const response = await fetch(provider.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok)
      return Response.json({ error: "OAuth token refresh failed." }, { status: 502 });

    const token = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };
    if (!token.access_token)
      return Response.json({ error: "Provider returned no access token." }, { status: 502 });
    const expiresAt = token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000).toISOString()
      : null;
    const accessTokenEncrypted = encryptSecret(token.access_token);
    const refreshTokenEncrypted = token.refresh_token
      ? encryptSecret(token.refresh_token)
      : stored.refresh_token_encrypted;
    const scopes = token.scope?.split(" ").filter(Boolean) ?? stored.scopes ?? provider.scopes;

    if (supabase) {
      const { error } = await supabase
        .from("integration_credentials")
        .update({
          access_token_encrypted: accessTokenEncrypted,
          refresh_token_encrypted: refreshTokenEncrypted,
          expires_at: expiresAt,
          scopes,
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", workspaceId)
        .eq("provider", providerId);
      if (error) throw error;
    } else {
      const sql = getNeon();
      if (!sql) return Response.json({ error: "Database not configured." }, { status: 503 });
      await sql`
        update integration_credentials
        set access_token_encrypted = ${accessTokenEncrypted},
            refresh_token_encrypted = ${refreshTokenEncrypted},
            expires_at = ${expiresAt},
            scopes = ${JSON.stringify(scopes)}::jsonb,
            updated_at = now()
        where workspace_id = ${workspaceId} and provider = ${providerId}
      `;
    }

    await writeAudit({
      workspaceId,
      actor: principal.subject,
      actorType: principal.kind === "session" ? "session" : "api_key",
      action: "oauth.token_rotated",
      target: providerId,
      outcome: "executed",
    });
    return Response.json({ refreshed: true, provider: providerId, workspaceId, expiresAt, scopes });
  } catch {
    return Response.json({ error: "Could not rotate OAuth tokens." }, { status: 503 });
  }
}
