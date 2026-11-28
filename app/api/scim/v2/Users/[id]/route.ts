import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import {
  validateScimToken,
  toScimUser,
  scimError,
  scimResponse,
  parsePatchOps,
  SCIM_SCHEMAS,
  type ScimUser,
} from "@/lib/scim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function scimBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}/api/scim/v2`;
}

function auth(request: Request): boolean {
  const token = process.env.SCIM_TOKEN;
  if (!token) return false;
  return validateScimToken(request.headers.get("authorization"), token);
}

type Params = { params: Promise<{ id: string }> };

/** GET /api/scim/v2/Users/[id] */
export async function GET(request: NextRequest, { params }: Params) {
  if (!auth(request)) return scimError(401, "Unauthorized");
  const workspaceId = request.headers.get("x-scim-workspace-id");
  if (!workspaceId) return scimError(400, "x-scim-workspace-id header required");

  const { id } = await params;
  const neon = getNeon();
  if (!neon) return scimError(503, "Database not configured");

  type Row = ScimUser;
  const rows = (await neon`
    SELECT id, external_id as "externalId", workspace_id as "workspaceId",
           user_name as "userName", given_name as "givenName", family_name as "familyName",
           display_name as "displayName", email, active,
           created_at as "createdAt", updated_at as "updatedAt"
    FROM scim_users
    WHERE id = ${id} AND workspace_id = ${workspaceId}
    LIMIT 1
  `) as unknown as Row[];

  if (!rows.length) return scimError(404, `User ${id} not found`);
  return scimResponse(toScimUser(rows[0], scimBaseUrl(request)));
}

/** PUT /api/scim/v2/Users/[id] — replace user */
export async function PUT(request: NextRequest, { params }: Params) {
  if (!auth(request)) return scimError(401, "Unauthorized");
  const workspaceId = request.headers.get("x-scim-workspace-id");
  if (!workspaceId) return scimError(400, "x-scim-workspace-id header required");

  const { id } = await params;
  const neon = getNeon();
  if (!neon) return scimError(503, "Database not configured");

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return scimError(400, "Invalid JSON");
  }

  const emails = body.emails as { value: string; primary?: boolean }[] | undefined;
  const email = emails?.find((e) => e.primary)?.value ?? emails?.[0]?.value;
  const userName = body.userName as string;
  if (!userName || !email) return scimError(400, "userName and a primary email are required");

  const name = body.name as Record<string, string> | undefined;
  const now = new Date().toISOString();
  const active = body.active === undefined ? true : Boolean(body.active);

  await neon`
    UPDATE scim_users
    SET user_name     = ${userName},
        given_name    = ${name?.givenName ?? null},
        family_name   = ${name?.familyName ?? null},
        display_name  = ${(body.displayName as string) ?? null},
        email         = ${email},
        active        = ${active},
        external_id   = ${(body.externalId as string) ?? null},
        updated_at    = ${now}
    WHERE id = ${id} AND workspace_id = ${workspaceId}
  `;

  type Row = ScimUser;
  const rows = (await neon`
    SELECT id, external_id as "externalId", workspace_id as "workspaceId",
           user_name as "userName", given_name as "givenName", family_name as "familyName",
           display_name as "displayName", email, active,
           created_at as "createdAt", updated_at as "updatedAt"
    FROM scim_users
    WHERE id = ${id} AND workspace_id = ${workspaceId}
    LIMIT 1
  `) as unknown as Row[];

  if (!rows.length) return scimError(404, `User ${id} not found`);
  return scimResponse(toScimUser(rows[0], scimBaseUrl(request)));
}

/** PATCH /api/scim/v2/Users/[id] — partial update */
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!auth(request)) return scimError(401, "Unauthorized");
  const workspaceId = request.headers.get("x-scim-workspace-id");
  if (!workspaceId) return scimError(400, "x-scim-workspace-id header required");

  const { id } = await params;
  const neon = getNeon();
  if (!neon) return scimError(503, "Database not configured");

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return scimError(400, "Invalid JSON");
  }

  const schemas = body.schemas as string[] | undefined;
  if (!schemas?.includes(SCIM_SCHEMAS.patchOp)) {
    return scimError(400, "schemas must include urn:ietf:params:scim:api:messages:2.0:PatchOp");
  }

  const ops = parsePatchOps(body);
  if (!ops) return scimError(400, "Invalid PATCH operations");

  const now = new Date().toISOString();

  for (const op of ops) {
    const lp = (op.path ?? "").toLowerCase();

    if (lp === "active" || (lp === "" && op.op === "replace")) {
      // Activate/deactivate
      const val =
        typeof op.value === "object" && op.value !== null
          ? (op.value as Record<string, unknown>).active
          : op.value;
      if (val !== undefined) {
        await neon`UPDATE scim_users SET active = ${Boolean(val)}, updated_at = ${now} WHERE id = ${id} AND workspace_id = ${workspaceId}`;
      }
    } else if (lp === "username") {
      await neon`UPDATE scim_users SET user_name = ${String(op.value)}, updated_at = ${now} WHERE id = ${id} AND workspace_id = ${workspaceId}`;
    } else if (lp === "name.givenname") {
      await neon`UPDATE scim_users SET given_name = ${String(op.value)}, updated_at = ${now} WHERE id = ${id} AND workspace_id = ${workspaceId}`;
    } else if (lp === "name.familyname") {
      await neon`UPDATE scim_users SET family_name = ${String(op.value)}, updated_at = ${now} WHERE id = ${id} AND workspace_id = ${workspaceId}`;
    } else if (lp === "displayname") {
      await neon`UPDATE scim_users SET display_name = ${String(op.value)}, updated_at = ${now} WHERE id = ${id} AND workspace_id = ${workspaceId}`;
    }
    // Other paths are silently ignored per RFC 7644 §3.5.2
  }

  type Row = ScimUser;
  const rows = (await neon`
    SELECT id, external_id as "externalId", workspace_id as "workspaceId",
           user_name as "userName", given_name as "givenName", family_name as "familyName",
           display_name as "displayName", email, active,
           created_at as "createdAt", updated_at as "updatedAt"
    FROM scim_users
    WHERE id = ${id} AND workspace_id = ${workspaceId}
    LIMIT 1
  `) as unknown as Row[];

  if (!rows.length) return scimError(404, `User ${id} not found`);
  return scimResponse(toScimUser(rows[0], scimBaseUrl(request)));
}

/** DELETE /api/scim/v2/Users/[id] — deprovision user */
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!auth(request)) return scimError(401, "Unauthorized");
  const workspaceId = request.headers.get("x-scim-workspace-id");
  if (!workspaceId) return scimError(400, "x-scim-workspace-id header required");

  const { id } = await params;
  const neon = getNeon();
  if (!neon) return scimError(503, "Database not configured");

  await neon`DELETE FROM scim_users WHERE id = ${id} AND workspace_id = ${workspaceId}`;

  return new Response(null, { status: 204 });
}
