import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProvider, isProviderConfigured, verifyOAuthState } from "@/lib/oauth";
import { accessError, authorizeWorkspace } from "@/lib/auth/authorization";
import { encryptSecret } from "@/lib/security/secrets";
import { getSupabase } from "@/lib/supabase";
import { getNeon } from "@/lib/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: id } = await params;
  const provider = getProvider(id);
  if (!provider) return NextResponse.json({ error: "Unknown provider." }, { status: 404 });
  const state = request.nextUrl.searchParams.get("state");
  const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? "";
  const storedState = request.cookies.get("eidon_oauth_state")?.value ?? null;
  if (!workspaceId || !verifyOAuthState(state, id, workspaceId) || state !== storedState) {
    return NextResponse.json({ error: "Invalid or expired OAuth state." }, { status: 400 });
  }
  try {
    await authorizeWorkspace(request, workspaceId, "admin");
  } catch (error) {
    return accessError(error);
  }
  const errorCode = request.nextUrl.searchParams.get("error");
  if (errorCode)
    return NextResponse.json(
      { error: `OAuth authorization failed: ${errorCode}` },
      { status: 400 },
    );
  const code = request.nextUrl.searchParams.get("code");
  if (!code)
    return NextResponse.json({ error: "OAuth authorization code is missing." }, { status: 400 });
  if (!isProviderConfigured(id))
    return NextResponse.json({ error: "OAuth provider is not configured." }, { status: 503 });
  if (!process.env.EIDON_TOKEN_ENCRYPTION_KEY)
    return NextResponse.json({ error: "Token encryption is not configured." }, { status: 503 });

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: process.env[provider.clientIdEnv] ?? "",
    client_secret: process.env[provider.clientSecretEnv] ?? "",
    redirect_uri: `${request.nextUrl.origin}/api/oauth/${id}/callback?workspaceId=${encodeURIComponent(workspaceId)}`,
  });
  const response = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!response.ok)
    return NextResponse.json({ error: "OAuth token exchange failed." }, { status: 502 });
  const token = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!token.access_token)
    return NextResponse.json(
      { error: "OAuth provider returned no access token." },
      { status: 502 },
    );

  const accessTokenEncrypted = encryptSecret(token.access_token);
  const refreshTokenEncrypted = token.refresh_token ? encryptSecret(token.refresh_token) : null;
  const expiresAt = token.expires_in
    ? new Date(Date.now() + token.expires_in * 1000).toISOString()
    : null;
  const supabase = await getSupabase();
  if (supabase) {
    const { error: persistError } = await supabase.from("integration_credentials").upsert({
      workspace_id: workspaceId,
      provider: id,
      access_token_encrypted: accessTokenEncrypted,
      refresh_token_encrypted: refreshTokenEncrypted,
      expires_at: expiresAt,
      scopes: token.scope?.split(" ") ?? provider.scopes,
      updated_at: new Date().toISOString(),
    });
    if (persistError)
      return NextResponse.json(
        { error: "Could not persist integration credential." },
        { status: 500 },
      );
  } else {
    const sql = getNeon();
    if (!sql) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
    await sql`
      insert into integration_credentials (workspace_id, provider, access_token_encrypted, refresh_token_encrypted, expires_at, scopes, updated_at)
      values (${workspaceId}, ${id}, ${accessTokenEncrypted}, ${refreshTokenEncrypted}, ${expiresAt}, ${JSON.stringify(token.scope?.split(" ") ?? provider.scopes)}, now())
      on conflict (workspace_id, provider) do update set access_token_encrypted = excluded.access_token_encrypted,
        refresh_token_encrypted = excluded.refresh_token_encrypted, expires_at = excluded.expires_at,
        scopes = excluded.scopes, updated_at = now()
    `;
  }

  const result = NextResponse.json({ connected: true, provider: id, workspaceId });
  result.cookies.set("eidon_oauth_state", "", {
    httpOnly: true,
    expires: new Date(0),
    path: `/api/oauth/${id}`,
  });
  return result;
}
