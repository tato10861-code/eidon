/**
 * Workspace settings API — read and update workspace-level configuration.
 *
 * GET  /api/workspaces/settings?workspaceId=  — fetch current settings
 * PATCH /api/workspaces/settings              — update one or more settings
 *
 * Settings surface:
 *   - name, slug
 *   - default AI model
 *   - allowed domains (email domain restriction)
 *   - retention policy (conversation retention days)
 *   - feature flags (custom per-workspace)
 *   - notification preferences
 */

import type { NextRequest } from "next/server";
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

  const neon = getNeon();
  if (!neon) {
    return Response.json({ workspaceId, settings: {} });
  }

  type Row = {
    id: string;
    name: string;
    subscription_status: string | null;
    seats: number | null;
    sso_provider: string | null;
    sso_domain: string | null;
    ip_allowlist: unknown;
    settings: unknown;
    updated_at: string | null;
  };

  const rows = (await neon`
    SELECT id, name, subscription_status, seats, sso_provider, sso_domain,
           ip_allowlist, settings, updated_at
    FROM workspaces WHERE id = ${workspaceId} LIMIT 1
  `) as unknown as Row[];

  if (!rows.length) {
    return Response.json({ error: "Workspace not found" }, { status: 404 });
  }

  const w = rows[0];
  const settings = (w.settings as Record<string, unknown>) ?? {};

  return Response.json({
    workspaceId: w.id,
    name: w.name,
    subscriptionStatus: w.subscription_status,
    seats: w.seats,
    ssoProvider: w.sso_provider,
    ssoDomain: w.sso_domain,
    ipAllowlistEnabled: Array.isArray(w.ip_allowlist) && (w.ip_allowlist as unknown[]).length > 0,
    settings: {
      defaultModel: settings.defaultModel ?? null,
      allowedEmailDomains: settings.allowedEmailDomains ?? [],
      conversationRetentionDays: settings.conversationRetentionDays ?? 365,
      requireMfa: settings.requireMfa ?? false,
      auditLogRetentionDays: settings.auditLogRetentionDays ?? 730,
      webhookSigningEnabled: settings.webhookSigningEnabled ?? true,
      scimProvisioning: settings.scimProvisioning ?? false,
      featureFlags: settings.featureFlags ?? {},
    },
    updatedAt: w.updated_at,
  });
}

export async function PATCH(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    workspaceId?: string;
    name?: string;
    settings?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workspaceId, name, settings } = body;
  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  // Validate settings keys
  const allowedSettingKeys = new Set([
    "defaultModel",
    "allowedEmailDomains",
    "conversationRetentionDays",
    "requireMfa",
    "auditLogRetentionDays",
    "webhookSigningEnabled",
    "scimProvisioning",
    "featureFlags",
  ]);

  if (settings) {
    const unknownKeys = Object.keys(settings).filter((k) => !allowedSettingKeys.has(k));
    if (unknownKeys.length > 0) {
      return Response.json(
        { error: `Unknown settings keys: ${unknownKeys.join(", ")}` },
        { status: 422 },
      );
    }
  }

  // Merge settings with existing
  if (settings && Object.keys(settings).length > 0) {
    await neon`
      UPDATE workspaces
      SET settings = COALESCE(settings, '{}'::jsonb) || ${JSON.stringify(settings)}::jsonb,
          updated_at = ${new Date().toISOString()}
      WHERE id = ${workspaceId}
    `;
  }

  if (name) {
    await neon`
      UPDATE workspaces SET name = ${name}, updated_at = ${new Date().toISOString()}
      WHERE id = ${workspaceId}
    `;
  }

  // Audit
  try {
    await neon`
      INSERT INTO audit_log (workspace_id, actor, action, target, payload)
      VALUES (${workspaceId}, 'api', 'settings.updated', ${workspaceId},
              ${JSON.stringify({ name, settings })}::jsonb)
    `;
  } catch {
    /* non-fatal */
  }

  return Response.json({ ok: true, workspaceId });
}
