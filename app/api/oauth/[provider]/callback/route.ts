import { NextResponse } from "next/server";
import { getProvider, isProviderConfigured } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: id } = await params;
  const provider = getProvider(id);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider." }, { status: 404 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!isProviderConfigured(id)) {
    return NextResponse.json({
      configured: false,
      provider: id,
      message:
        "Demo mode: no token exchange performed. In production this exchanges the code for an access token.",
      code: code ?? "demo-code",
    });
  }

  // Real token exchange would go here using provider.tokenUrl + client secret.
  // Kept as a documented extension point.
  return NextResponse.json({
    configured: true,
    provider: id,
    message: "Token exchange endpoint ready. Implement exchange using provider.tokenUrl.",
    code,
  });
}
