/**
 * Role-Based Access Control for Eidon workspaces.
 *
 * Hierarchy (highest to lowest): owner > admin > member > viewer
 * Any role can perform actions at or below its level.
 */

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export type Permission =
  | "workspace:read"
  | "workspace:write"
  | "workspace:delete"
  | "members:read"
  | "members:invite"
  | "members:remove"
  | "members:change_role"
  | "employees:read"
  | "employees:create"
  | "employees:edit"
  | "employees:delete"
  | "conversations:read"
  | "conversations:write"
  | "conversations:delete_all"
  | "api_keys:read"
  | "api_keys:create"
  | "api_keys:revoke"
  | "billing:read"
  | "billing:write"
  | "audit:read"
  | "settings:read"
  | "settings:write"
  | "integrations:read"
  | "integrations:manage"
  | "scim:manage"
  | "sso:manage"
  | "ip_allowlist:manage"
  | "export:request"
  | "export:download";

const GRANTS: Record<WorkspaceRole, Permission[]> = {
  viewer: [
    "workspace:read",
    "members:read",
    "employees:read",
    "conversations:read",
    "settings:read",
  ],
  member: [
    "workspace:read",
    "members:read",
    "employees:read",
    "employees:create",
    "employees:edit",
    "conversations:read",
    "conversations:write",
    "api_keys:read",
    "api_keys:create",
    "settings:read",
    "integrations:read",
    "export:request",
  ],
  admin: [
    "workspace:read",
    "workspace:write",
    "members:read",
    "members:invite",
    "members:remove",
    "employees:read",
    "employees:create",
    "employees:edit",
    "employees:delete",
    "conversations:read",
    "conversations:write",
    "conversations:delete_all",
    "api_keys:read",
    "api_keys:create",
    "api_keys:revoke",
    "billing:read",
    "audit:read",
    "settings:read",
    "settings:write",
    "integrations:read",
    "integrations:manage",
    "export:request",
    "export:download",
  ],
  owner: [
    "workspace:read",
    "workspace:write",
    "workspace:delete",
    "members:read",
    "members:invite",
    "members:remove",
    "members:change_role",
    "employees:read",
    "employees:create",
    "employees:edit",
    "employees:delete",
    "conversations:read",
    "conversations:write",
    "conversations:delete_all",
    "api_keys:read",
    "api_keys:create",
    "api_keys:revoke",
    "billing:read",
    "billing:write",
    "audit:read",
    "settings:read",
    "settings:write",
    "integrations:read",
    "integrations:manage",
    "scim:manage",
    "sso:manage",
    "ip_allowlist:manage",
    "export:request",
    "export:download",
  ],
};

/** Check whether a workspace role has a given permission. */
export function can(role: WorkspaceRole, permission: Permission): boolean {
  return GRANTS[role]?.includes(permission) ?? false;
}

/** All permissions held by a role (for JWT claims, UI rendering, etc.). */
export function permissionsFor(role: WorkspaceRole): Permission[] {
  return GRANTS[role] ?? [];
}

/** True if `a` is at least as privileged as `b`. */
export function atLeast(a: WorkspaceRole, b: WorkspaceRole): boolean {
  const order: WorkspaceRole[] = ["viewer", "member", "admin", "owner"];
  return order.indexOf(a) >= order.indexOf(b);
}

/** Minimum role required for a permission. */
export function minimumRoleFor(permission: Permission): WorkspaceRole | null {
  const order: WorkspaceRole[] = ["viewer", "member", "admin", "owner"];
  for (const role of order) {
    if (can(role, permission)) return role;
  }
  return null;
}

/** Validate that a role string is a known WorkspaceRole. */
export function isValidRole(role: string): role is WorkspaceRole {
  return ["owner", "admin", "member", "viewer"].includes(role);
}
