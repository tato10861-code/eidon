/**
 * Feature flags API for a workspace.
 *
 * GET   /api/workspaces/flags?workspaceId=  — get current flags
 * PATCH /api/workspaces/flags              — toggle flags
 */

import type { NextRequest } from "next/server";
import { getWorkspaceFlags, setWorkspaceFlags, type FeatureFlags } from "@/lib/feature-flags";
import { getNeon } from "@/lib/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdminKey(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  return key === expected;
}

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const flags = await getWorkspaceFlags(workspaceId);
  return Response.json({ workspaceId, flags });
}

export async function PATCH(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { workspaceId?: string; flags?: Partial<FeatureFlags> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workspaceId, flags } = body;
  if (!workspaceId || !flags) {
    return Response.json({ error: "workspaceId and flags are required" }, { status: 400 });
  }

  // Validate flag names
  const validKeys: (keyof FeatureFlags)[] = [
    "advancedEvals",
    "multiModelRouting",
    "streamingDefault",
    "persistentMemory",
    "toolCalling",
    "fineTuning",
    "realtimeCollaboration",
    "dataRetention",
    "costEstimation",
    "webhookDeliveryLogs",
  ];
  const unknownKeys = Object.keys(flags).filter(
    (k) => !validKeys.includes(k as keyof FeatureFlags),
  );
  if (unknownKeys.length > 0) {
    return Response.json({ error: `Unknown flags: ${unknownKeys.join(", ")}` }, { status: 422 });
  }

  await setWorkspaceFlags(workspaceId, flags);

  // Audit
  const neon = getNeon();
  if (neon) {
    neon`
      INSERT INTO audit_log (workspace_id, actor, action, target, payload)
      VALUES (${workspaceId}, 'api', 'settings.flags_updated', ${workspaceId},
              ${JSON.stringify(flags)}::jsonb)
    `.catch(() => {});
  }

  const updated = await getWorkspaceFlags(workspaceId);
  return Response.json({ workspaceId, flags: updated });
}
