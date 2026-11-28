import type { NextRequest } from "next/server";
import {
  extractBearerKey,
  extractPrefix,
  hasScope,
  verifyApiKey,
  type ApiKey,
  type ApiKeyScope,
} from "@/lib/api-keys";
import { getSupabase } from "@/lib/supabase";
import { getNeon } from "@/lib/neon";
import { findPersistedApiKeysByPrefix, touchPersistedApiKey } from "@/lib/api-key-store";

export type AccessPrincipal =
  | { kind: "demo"; subject: "demo"; workspaceId: string }
  | { kind: "session"; subject: string; workspaceId: string; role: string }
  | { kind: "api-key"; subject: string; workspaceId: string; role: "api"; key: ApiKey };

export class AccessDenied extends Error {
  readonly status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = "AccessDenied";
    this.status = status;
  }
}

/** Production must opt into authentication whenever a durable database is configured. */
export function requiresAuthentication() {
  return (
    process.env.EIDON_REQUIRE_AUTH === "true" ||
    Boolean(process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)
  );
}

function bearer(request: NextRequest) {
  return extractBearerKey(request.headers.get("authorization"));
}

function readSupabaseAccessToken(request: NextRequest): string | null {
  const cookie = request.cookies
    .getAll()
    .find((item) => item.name.startsWith("sb-") && item.name.endsWith("-auth-token"));
  if (!cookie?.value) return null;
  try {
    const decoded = decodeURIComponent(cookie.value);
    const parsed = JSON.parse(decoded) as unknown;
    if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0];
    if (parsed && typeof parsed === "object" && "access_token" in parsed) {
      const token = (parsed as { access_token?: unknown }).access_token;
      return typeof token === "string" ? token : null;
    }
  } catch {
    return null;
  }
  return null;
}

// The demo store is intentionally process-local. Production key issuance must use the database table.
const apiKeyStore = new Map<string, ApiKey>();
export function registerDemoApiKey(key: ApiKey) {
  apiKeyStore.set(key.id, key);
}
export function revokeDemoApiKey(id: string) {
  return apiKeyStore.delete(id);
}

async function findApiKey(raw: string): Promise<ApiKey | null> {
  const prefix = extractPrefix(raw);
  if (!prefix) return null;
  let candidates = [...apiKeyStore.values()].filter((item) => item.prefix === prefix);
  try {
    const persisted = await findPersistedApiKeysByPrefix(prefix);
    if (persisted) candidates = [...candidates, ...persisted];
  } catch {
    // A database outage must not turn demo authorization into a server crash.
  }
  for (const candidate of candidates) {
    if (candidate.expiresAt !== null && candidate.expiresAt <= Date.now()) continue;
    if (await verifyApiKey(raw, candidate.hash)) {
      void touchPersistedApiKey(candidate.id).catch(() => undefined);
      return candidate;
    }
  }
  return null;
}

async function membership(userId: string, workspaceId: string) {
  const supabase = await getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("workspace_memberships")
      .select("role")
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (data?.role) return String(data.role);
  }
  const sql = getNeon();
  if (sql) {
    const rows = await sql`
      select role from workspace_memberships
      where user_id = ${userId} and workspace_id = ${workspaceId}
      limit 1
    `;
    const role = (rows as { role?: string }[])[0]?.role;
    if (role) return role;
  }
  return null;
}

export async function authorizeWorkspace(
  request: NextRequest,
  workspaceId: string,
  requiredScope?: ApiKeyScope,
): Promise<AccessPrincipal> {
  const normalizedWorkspaceId = workspaceId.trim();
  if (!normalizedWorkspaceId) throw new AccessDenied("workspaceId is required.", 400);

  const rawKey = bearer(request);
  if (rawKey) {
    const key = await findApiKey(rawKey);
    if (!key || key.workspaceId !== normalizedWorkspaceId) {
      throw new AccessDenied("Invalid API key or workspace.", 401);
    }
    if (requiredScope && !hasScope(key, requiredScope)) {
      throw new AccessDenied("API key scope is insufficient.", 403);
    }
    key.lastUsedAt = Date.now();
    return {
      kind: "api-key",
      subject: key.id,
      workspaceId: normalizedWorkspaceId,
      role: "api",
      key,
    };
  }

  const token = readSupabaseAccessToken(request);
  if (token) {
    const supabase = await getSupabase();
    const { data } = supabase ? await supabase.auth.getUser(token) : { data: { user: null } };
    const user = data?.user;
    if (user) {
      const role = await membership(user.id, normalizedWorkspaceId);
      if (role) {
        if (requiredScope === "admin" && !["owner", "admin"].includes(role)) {
          throw new AccessDenied("Workspace administrator access is required.", 403);
        }
        if (requiredScope === "export:read" && role === "viewer") {
          throw new AccessDenied("Export access is not enabled for this role.", 403);
        }
        return { kind: "session", subject: user.id, workspaceId: normalizedWorkspaceId, role };
      }
    }
  }

  if (!requiresAuthentication() && normalizedWorkspaceId === "demo") {
    return { kind: "demo", subject: "demo", workspaceId: "demo" };
  }
  throw new AccessDenied("Authentication and workspace membership are required.", 401);
}

export async function authenticateRequest(request: NextRequest): Promise<AccessPrincipal> {
  const rawKey = bearer(request);
  if (rawKey) {
    const key = await findApiKey(rawKey);
    if (key)
      return { kind: "api-key", subject: key.id, workspaceId: key.workspaceId, role: "api", key };
  }
  const token = readSupabaseAccessToken(request);
  if (token) {
    const supabase = await getSupabase();
    const { data } = supabase ? await supabase.auth.getUser(token) : { data: { user: null } };
    if (data?.user)
      return { kind: "session", subject: data.user.id, workspaceId: "", role: "owner" };
  }
  if (!requiresAuthentication()) return { kind: "demo", subject: "demo", workspaceId: "demo" };
  throw new AccessDenied("Authentication is required.", 401);
}

export function accessError(error: unknown) {
  if (error instanceof AccessDenied) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json({ error: "Authorization failed." }, { status: 500 });
}
