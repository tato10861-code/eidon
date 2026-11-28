import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import {
  validateScimToken,
  toScimUser,
  listResponse,
  scimError,
  scimResponse,
  parsePagination,
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

function extractUserFields(body: Record<string, unknown>): {
  userName: string;
  email: string;
  givenName?: string;
  familyName?: string;
  displayName?: string;
  externalId?: string;
  active: boolean;
} | null {
  const userName = body.userName as string;
  const emails = body.emails as { value: string; primary?: boolean }[] | undefined;
  const email =
    emails?.find((e) => e.primary)?.value ??
    emails?.[0]?.value ??
    (userName?.includes("@") ? userName : null);
  if (!userName || !email) return null;
  const name = body.name as Record<string, string> | undefined;
  return {
    userName,
    email,
    givenName: name?.givenName,
    familyName: name?.familyName,
    displayName: (body.displayName as string) ?? undefined,
    externalId: (body.externalId as string) ?? undefined,
    active: body.active === undefined ? true : Boolean(body.active),
  };
}

/** GET /api/scim/v2/Users — list provisioned users */
export async function GET(request: NextRequest) {
  if (!auth(request)) return scimError(401, "Unauthorized");

  const workspaceId = request.headers.get("x-scim-workspace-id");
  if (!workspaceId) return scimError(400, "x-scim-workspace-id header required");

  const neon = getNeon();
  if (!neon) return scimResponse(listResponse([], 0));

  const url = new URL(request.url);
  const { startIndex, count } = parsePagination(url);
  const filter = url.searchParams.get("filter");

  const offset = startIndex - 1;
  type Row = ScimUser;
  type CountRow = { n: string };

  let rows: Row[];
  let total: number;

  if (filter) {
    // Basic filter support: userName eq "value"
    const match = filter.match(/^userName\s+eq\s+"([^"]+)"$/i);
    if (!match) return scimError(400, "Only 'userName eq' filter is supported", "invalidFilter");
    const username = match[1];
    rows = (await neon`
      SELECT id, external_id as "externalId", workspace_id as "workspaceId",
             user_name as "userName", given_name as "givenName", family_name as "familyName",
             display_name as "displayName", email, active,
             created_at as "createdAt", updated_at as "updatedAt"
      FROM scim_users
      WHERE workspace_id = ${workspaceId} AND user_name = ${username}
      LIMIT 1
    `) as unknown as Row[];
    total = rows.length;
  } else {
    type CountRow = { n: string };
    const [listRows, countRows] = await Promise.all([
      neon`
        SELECT id, external_id as "externalId", workspace_id as "workspaceId",
               user_name as "userName", given_name as "givenName", family_name as "familyName",
               display_name as "displayName", email, active,
               created_at as "createdAt", updated_at as "updatedAt"
        FROM scim_users
        WHERE workspace_id = ${workspaceId}
        ORDER BY created_at
        LIMIT ${count} OFFSET ${offset}
      ` as unknown as Promise<Row[]>,
      neon`SELECT count(*) AS n FROM scim_users WHERE workspace_id = ${workspaceId}` as unknown as Promise<
        CountRow[]
      >,
    ]);
    rows = listRows;
    total = parseInt(countRows[0]?.n ?? "0", 10);
  }

  const base = scimBaseUrl(request);
  return scimResponse(
    listResponse(
      rows.map((r) => toScimUser(r, base)),
      total,
      startIndex,
      count,
    ),
  );
}

/** POST /api/scim/v2/Users — provision a new user */
export async function POST(request: NextRequest) {
  if (!auth(request)) return scimError(401, "Unauthorized");

  const workspaceId = request.headers.get("x-scim-workspace-id");
  if (!workspaceId) return scimError(400, "x-scim-workspace-id header required");

  const neon = getNeon();
  if (!neon) return scimError(503, "Database not configured");

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return scimError(400, "Invalid JSON");
  }

  const schemas = body.schemas as string[] | undefined;
  if (!schemas?.includes(SCIM_SCHEMAS.user)) {
    return scimError(400, "schemas must include urn:ietf:params:scim:schemas:core:2.0:User");
  }

  const fields = extractUserFields(body);
  if (!fields) return scimError(400, "userName and a primary email are required");

  // Check for existing user
  type ExistRow = { id: string };
  const existing = (await neon`
    SELECT id FROM scim_users WHERE workspace_id = ${workspaceId} AND user_name = ${fields.userName}
    LIMIT 1
  `) as unknown as ExistRow[];

  if (existing.length > 0) {
    return scimError(409, `User ${fields.userName} already exists`, "uniqueness");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await neon`
    INSERT INTO scim_users (
      id, workspace_id, external_id, user_name, given_name, family_name,
      display_name, email, active, created_at, updated_at
    ) VALUES (
      ${id}, ${workspaceId}, ${fields.externalId ?? null}, ${fields.userName},
      ${fields.givenName ?? null}, ${fields.familyName ?? null},
      ${fields.displayName ?? null}, ${fields.email}, ${fields.active},
      ${now}, ${now}
    )
  `;

  const user: ScimUser = {
    id,
    workspaceId,
    externalId: fields.externalId,
    userName: fields.userName,
    givenName: fields.givenName,
    familyName: fields.familyName,
    displayName: fields.displayName,
    email: fields.email,
    active: fields.active,
    createdAt: now,
    updatedAt: now,
  };

  return scimResponse(toScimUser(user, scimBaseUrl(request)), 201);
}
