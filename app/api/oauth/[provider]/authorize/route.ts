import { NextResponse } from "next/server";
import { getProvider, isProviderConfigured, buildAuthorizeUrl } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: id } = await params;
  const provider = getProvider(id);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider." }, { status: 404 });
  }

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/oauth/${id}/callback`;
  const state = crypto.randomUUID();

  if (!isProviderConfigured(id)) {
    return NextResponse.json({
      configured: false,
      provider: id,
      message:
        "Demo mode: provider not configured. Set the client ID/secret env vars to enable live OAuth.",
      mockAuthorizeUrl: buildAuthorizeUrl(id, redirectUri, state),
    });
  }

  const authorizeUrl = buildAuthorizeUrl(id, redirectUri, state);
  return NextResponse.redirect(authorizeUrl!);
}
