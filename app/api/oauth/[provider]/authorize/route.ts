import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getProvider,
  isProviderConfigured,
  buildAuthorizeUrl,
  createOAuthState,
} from "@/lib/oauth";
import { accessError, authorizeWorkspace } from "@/lib/auth/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: id } = await params;
  const provider = getProvider(id);
  if (!provider) return NextResponse.json({ error: "Unknown provider." }, { status: 404 });

  const workspaceId = request.nextUrl.searchParams.get("workspaceId")?.trim();
  if (!workspaceId)
    return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
  try {
    await authorizeWorkspace(request, workspaceId, "admin");
  } catch (error) {
    return accessError(error);
  }

  const redirectUri = `${request.nextUrl.origin}/api/oauth/${id}/callback?workspaceId=${encodeURIComponent(workspaceId)}`;
  const state = createOAuthState(id, workspaceId);
  const response = !isProviderConfigured(id)
    ? NextResponse.json({
        configured: false,
        provider: id,
        workspaceId,
        message:
          "Demo mode: provider not configured. Set the client ID/secret env vars to enable live OAuth.",
        mockAuthorizeUrl: buildAuthorizeUrl(id, redirectUri, state),
      })
    : NextResponse.redirect(buildAuthorizeUrl(id, redirectUri, state)!);

  response.cookies.set("eidon_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: `/api/oauth/${id}`,
    maxAge: 600,
  });
  return response;
}
