/**
 * SSO metadata and configuration endpoints.
 *
 * GET  /api/auth/sso?workspaceId=   — fetch workspace SSO config
 * POST /api/auth/sso                — configure SSO (SAML or OIDC)
 * GET  /api/auth/sso/metadata.xml   — SAML SP metadata XML (served via ?metadata=1)
 *
 * In a production deployment this would integrate with an identity library
 * such as node-saml or @boxyhq/saml-jackson. This module provides the
 * configuration plane and correct SP metadata so enterprise IT can set up
 * the IdP side.
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

/** Build the SAML SP metadata XML for this Eidon instance. */
function buildSamlMetadata(baseUrl: string, workspaceId: string): string {
  const acsUrl = `${baseUrl}/api/auth/saml/callback`;
  const entityId = `${baseUrl}/api/auth/sso?workspaceId=${workspaceId}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor
  xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
  entityID="${entityId}"
  validUntil="${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}">
  <md:SPSSODescriptor
    AuthnRequestsSigned="false"
    WantAssertionsSigned="true"
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>
      urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress
    </md:NameIDFormat>
    <md:AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${acsUrl}"
      index="1"
      isDefault="true"/>
  </md:SPSSODescriptor>
  <md:Organization>
    <md:OrganizationName xml:lang="en">Eidon AI</md:OrganizationName>
    <md:OrganizationDisplayName xml:lang="en">Eidon AI Workforce</md:OrganizationDisplayName>
    <md:OrganizationURL xml:lang="en">${baseUrl}</md:OrganizationURL>
  </md:Organization>
  <md:ContactPerson contactType="technical">
    <md:EmailAddress>security@eidon.ai</md:EmailAddress>
  </md:ContactPerson>
</md:EntityDescriptor>`;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");

  // ?metadata=1 returns SAML SP metadata XML (no auth required — public IdP config)
  if (url.searchParams.get("metadata") === "1") {
    if (!workspaceId) {
      return new Response("workspaceId is required", { status: 400 });
    }
    const baseUrl = `${url.protocol}//${url.host}`;
    return new Response(buildSamlMetadata(baseUrl, workspaceId), {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }

  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ workspaceId, ssoProvider: null, ssoDomain: null, configured: false });
  }

  type Row = { sso_provider: string | null; sso_domain: string | null };
  const rows = (await neon`
    SELECT sso_provider, sso_domain FROM workspaces WHERE id = ${workspaceId} LIMIT 1
  `) as unknown as Row[];

  if (!rows.length) {
    return Response.json({ error: "Workspace not found" }, { status: 404 });
  }

  return Response.json({
    workspaceId,
    ssoProvider: rows[0].sso_provider,
    ssoDomain: rows[0].sso_domain,
    configured: Boolean(rows[0].sso_provider),
    metadataUrl: `${url.protocol}//${url.host}/api/auth/sso?workspaceId=${workspaceId}&metadata=1`,
    acsUrl: `${url.protocol}//${url.host}/api/auth/saml/callback`,
  });
}

export async function POST(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    workspaceId?: string;
    provider?: "saml" | "oidc";
    domain?: string;
    samlIdpMetadataUrl?: string;
    samlIdpEntityId?: string;
    samlIdpSsoUrl?: string;
    oidcClientId?: string;
    oidcDiscoveryUrl?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workspaceId, provider, domain } = body;
  if (!workspaceId || !provider) {
    return Response.json({ error: "workspaceId and provider are required" }, { status: 400 });
  }
  if (!["saml", "oidc"].includes(provider)) {
    return Response.json({ error: "provider must be saml or oidc" }, { status: 422 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  await neon`
    UPDATE workspaces
    SET sso_provider = ${provider},
        sso_domain   = ${domain ?? null},
        updated_at   = ${new Date().toISOString()}
    WHERE id = ${workspaceId}
  `;

  try {
    await neon`
      INSERT INTO audit_log (workspace_id, actor, action, target, payload)
      VALUES (${workspaceId}, 'api', 'sso.configured', ${provider},
              ${JSON.stringify({ provider, domain: domain ?? null })}::jsonb)
    `;
  } catch {
    /* non-fatal */
  }

  return Response.json({
    ok: true,
    workspaceId,
    provider,
    domain: domain ?? null,
    metadataUrl: `${new URL(request.url).origin}/api/auth/sso?workspaceId=${workspaceId}&metadata=1`,
  });
}
