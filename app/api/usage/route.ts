/**
 * Usage analytics endpoint.
 * GET /api/usage?workspaceId=X
 */

import type { NextRequest } from "next/server";
import { getUsageSummary } from "@/lib/usage";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId") ?? "demo";

  const rl = rateLimit(`usage:${workspaceId}`, 60, 60_000);
  if (!rl.ok) {
    return Response.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const summary = getUsageSummary(workspaceId);
  return Response.json(summary);
}
