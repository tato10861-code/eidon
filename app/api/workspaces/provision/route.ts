/**
 * Workspace provisioning — create a fully configured workspace in one call.
 *
 * POST /api/workspaces/provision
 *
 * This "infrastructure API" is what enterprise IT teams call from their
 * Terraform provider, internal tooling, or onboarding automation. A single
 * request provisions a workspace with:
 *   - owner membership
 *   - optional SSO configuration
 *   - optional SCIM token (returned once, then hashed)
 *   - optional IP allowlist
 *   - default workspace settings
 *   - welcome audit event
 *
 * Response includes everything needed to wire up an IdP in one round-trip.
 */

import crypto from "node:crypto";
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

/** Hash a token with SHA-256 for safe storage. */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    slug?: string;
    ownerEmail?: string;
    plan?: "free" | "starter" | "pro" | "enterprise";
    seats?: number;
    sso?: { provider: "saml" | "oidc"; domain: string; idpMetadataUrl?: string };
    generateScimToken?: boolean;
    ipAllowlist?: string[];
    settings?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    name,
    slug,
    ownerEmail,
    plan = "pro",
    seats = 25,
    sso,
    generateScimToken = false,
    ipAllowlist,
    settings = {},
    metadata = {},
  } = body;

  if (!name || !ownerEmail) {
    return Response.json({ error: "name and ownerEmail are required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const workspaceId = crypto.randomUUID();
  const memberId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Derive a slug if not provided
  const resolvedSlug =
    slug ??
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);

  // Check slug uniqueness
  type SlugRow = { id: string };
  const existing = (await neon`
    SELECT id FROM workspaces WHERE slug = ${resolvedSlug} LIMIT 1
  `) as unknown as SlugRow[];

  if (existing.length > 0) {
    return Response.json({ error: `Slug "${resolvedSlug}" is already taken` }, { status: 409 });
  }

  // Generate SCIM token if requested
  let rawScimToken: string | null = null;
  let hashedScimToken: string | null = null;
  if (generateScimToken) {
    rawScimToken = `scim_${crypto.randomBytes(32).toString("hex")}`;
    hashedScimToken = hashToken(rawScimToken);
  }

  // Create workspace
  await neon`
    INSERT INTO workspaces (id, name, slug, subscription_status, seats,
                            sso_provider, sso_domain, scim_token,
                            ip_allowlist, settings, created_at, updated_at)
    VALUES (
      ${workspaceId}, ${name}, ${resolvedSlug}, ${plan}, ${seats},
      ${sso?.provider ?? null}, ${sso?.domain ?? null}, ${hashedScimToken},
      ${JSON.stringify(ipAllowlist ?? [])}::jsonb,
      ${JSON.stringify({ ...settings, ...metadata })}::jsonb,
      ${now}, ${now}
    )
  `;

  // Create owner membership
  await neon`
    INSERT INTO workspace_members (id, workspace_id, email, role, joined_at, created_at)
    VALUES (${memberId}, ${workspaceId}, ${ownerEmail}, 'owner', ${now}, ${now})
  `;

  // Audit: workspace provisioned
  await neon`
    INSERT INTO audit_log (workspace_id, actor, action, target, payload)
    VALUES (${workspaceId}, 'api', 'workspace.provisioned', ${ownerEmail},
            ${JSON.stringify({ plan, seats, sso: sso?.provider ?? null })}::jsonb)
  `.catch(() => {});

  const baseUrl = new URL(request.url).origin;

  return Response.json(
    {
      workspaceId,
      name,
      slug: resolvedSlug,
      plan,
      seats,
      ownerEmail,
      sso: sso
        ? {
            provider: sso.provider,
            domain: sso.domain,
            metadataUrl: `${baseUrl}/api/auth/sso?workspaceId=${workspaceId}&metadata=1`,
            acsUrl: `${baseUrl}/api/auth/saml/callback`,
            entityId: `${baseUrl}/api/auth/sso?workspaceId=${workspaceId}`,
          }
        : null,
      scim: generateScimToken
        ? {
            baseUrl: `${baseUrl}/api/scim/v2`,
            token: rawScimToken,
            note: "Store this token securely — it will not be shown again.",
          }
        : null,
      ipAllowlistEnabled: Boolean(ipAllowlist?.length),
      createdAt: now,
    },
    { status: 201 },
  );
}
