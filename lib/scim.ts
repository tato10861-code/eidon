/**
 * SCIM 2.0 (RFC 7643 / RFC 7644) helpers for Eidon.
 *
 * Provides schema constants, normalisation helpers, and response builders.
 * The route handlers in app/api/scim/v2/ use these to stay thin.
 */

export const SCIM_SCHEMAS = {
  listResponse: "urn:ietf:params:scim:api:messages:2.0:ListResponse",
  error: "urn:ietf:params:scim:api:messages:2.0:Error",
  patchOp: "urn:ietf:params:scim:api:messages:2.0:PatchOp",
  user: "urn:ietf:params:scim:schemas:core:2.0:User",
  group: "urn:ietf:params:scim:schemas:core:2.0:Group",
  enterpriseUser: "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
  serviceProviderConfig: "urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig",
} as const;

export interface ScimUser {
  id: string;
  externalId?: string | null;
  workspaceId: string;
  userName: string;
  givenName?: string | null;
  familyName?: string | null;
  displayName?: string | null;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScimGroup {
  id: string;
  externalId?: string | null;
  workspaceId: string;
  displayName: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

/** Serialise an internal user record to a SCIM User resource. */
export function toScimUser(u: ScimUser, baseUrl: string): object {
  return {
    schemas: [SCIM_SCHEMAS.user, SCIM_SCHEMAS.enterpriseUser],
    id: u.id,
    externalId: u.externalId ?? undefined,
    userName: u.userName,
    name: {
      formatted:
        [u.givenName, u.familyName].filter(Boolean).join(" ") || u.displayName || u.userName,
      givenName: u.givenName ?? undefined,
      familyName: u.familyName ?? undefined,
    },
    displayName: u.displayName ?? undefined,
    emails: [{ value: u.email, primary: true, type: "work" }],
    active: u.active,
    meta: {
      resourceType: "User",
      created: u.createdAt,
      lastModified: u.updatedAt,
      location: `${baseUrl}/Users/${u.id}`,
      version: `W/"${u.updatedAt}"`,
    },
    [SCIM_SCHEMAS.enterpriseUser]: {
      organization: u.workspaceId,
    },
  };
}

/** Serialise an internal group record to a SCIM Group resource. */
export function toScimGroup(g: ScimGroup, baseUrl: string): object {
  return {
    schemas: [SCIM_SCHEMAS.group],
    id: g.id,
    externalId: g.externalId ?? undefined,
    displayName: g.displayName,
    members: g.members.map((id) => ({
      value: id,
      $ref: `${baseUrl}/Users/${id}`,
    })),
    meta: {
      resourceType: "Group",
      created: g.createdAt,
      lastModified: g.updatedAt,
      location: `${baseUrl}/Groups/${g.id}`,
      version: `W/"${g.updatedAt}"`,
    },
  };
}

/** Build a SCIM ListResponse envelope. */
export function listResponse(
  resources: object[],
  total: number,
  startIndex = 1,
  count = 100,
): object {
  return {
    schemas: [SCIM_SCHEMAS.listResponse],
    totalResults: total,
    startIndex,
    itemsPerPage: Math.min(count, resources.length),
    Resources: resources,
  };
}

/** Build a SCIM error response. */
export function scimError(status: number, detail: string, scimType?: string): Response {
  return Response.json(
    {
      schemas: [SCIM_SCHEMAS.error],
      status,
      detail,
      ...(scimType ? { scimType } : {}),
    },
    {
      status,
      headers: {
        "Content-Type": "application/scim+json",
      },
    },
  );
}

/** Wrap any SCIM resource in a JSON response with the right content-type. */
export function scimResponse(body: object, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Content-Type": "application/scim+json" },
  });
}

/** Parse `startIndex` and `count` from SCIM query params. */
export function parsePagination(url: URL): { startIndex: number; count: number } {
  const startIndex = Math.max(1, parseInt(url.searchParams.get("startIndex") ?? "1", 10));
  const count = Math.min(200, Math.max(1, parseInt(url.searchParams.get("count") ?? "100", 10)));
  return { startIndex, count };
}

/** Parse a SCIM PATCH request body into operations. */
export interface PatchOp {
  op: "add" | "remove" | "replace";
  path?: string;
  value?: unknown;
}

export function parsePatchOps(body: unknown): PatchOp[] | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.Operations)) return null;
  const ops: PatchOp[] = [];
  for (const raw of b.Operations as unknown[]) {
    if (!raw || typeof raw !== "object") return null;
    const op = raw as Record<string, unknown>;
    const name = (op.op as string)?.toLowerCase();
    if (!["add", "remove", "replace"].includes(name)) return null;
    ops.push({ op: name as PatchOp["op"], path: op.path as string, value: op.value });
  }
  return ops;
}

/** Validate a bearer token against the workspace SCIM token. */
export function validateScimToken(authHeader: string | null, expected: string): boolean {
  if (!authHeader) return false;
  const match = authHeader.match(/^Bearer\s+(\S+)$/i);
  if (!match) return false;
  if (match[1].length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= match[1].charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
