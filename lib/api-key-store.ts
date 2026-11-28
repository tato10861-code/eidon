import { getNeon } from "@/lib/neon";
import { getSupabase } from "@/lib/supabase";
import type { ApiKey, ApiKeyScope } from "@/lib/api-keys";

interface StoredApiKeyRow {
  id: string;
  workspace_id: string;
  prefix: string;
  hash: string;
  name: string;
  scopes: ApiKeyScope[] | string[] | null;
  created_at: string | number;
  expires_at: string | number | null;
  last_used_at: string | number | null;
  revoked_at?: string | number | null;
  rate_limit?: number | null;
}

function toMillis(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toApiKey(row: StoredApiKeyRow): ApiKey {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    prefix: row.prefix,
    hash: row.hash,
    name: row.name,
    scopes: Array.isArray(row.scopes) ? (row.scopes as ApiKeyScope[]) : [],
    createdAt: toMillis(row.created_at) ?? Date.now(),
    expiresAt: toMillis(row.expires_at),
    lastUsedAt: toMillis(row.last_used_at),
    rateLimit: row.rate_limit ?? 1000,
  };
}

function isPersistableWorkspace(workspaceId: string) {
  return workspaceId !== "demo" && /^[0-9a-f-]{16,}$/i.test(workspaceId);
}

export async function persistApiKey(record: ApiKey): Promise<boolean> {
  if (!isPersistableWorkspace(record.workspaceId)) return false;
  const supabase = await getSupabase();
  if (supabase) {
    const { error } = await supabase.from("api_keys").insert({
      id: record.id,
      workspace_id: record.workspaceId,
      prefix: record.prefix,
      hash: record.hash,
      name: record.name,
      scopes: record.scopes,
      expires_at: record.expiresAt ? new Date(record.expiresAt).toISOString() : null,
      last_used_at: null,
    });
    if (error) throw error;
    return true;
  }
  const sql = getNeon();
  if (!sql) return false;
  await sql`
    insert into api_keys (id, workspace_id, prefix, hash, name, scopes, expires_at)
    values (${record.id}, ${record.workspaceId}, ${record.prefix}, ${record.hash}, ${record.name}, ${JSON.stringify(record.scopes)}::jsonb, ${record.expiresAt ? new Date(record.expiresAt).toISOString() : null})
  `;
  return true;
}

export async function listPersistedApiKeys(workspaceId: string): Promise<ApiKey[] | null> {
  if (!isPersistableWorkspace(workspaceId)) return null;
  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("api_keys")
      .select(
        "id, workspace_id, prefix, hash, name, scopes, created_at, expires_at, last_used_at, revoked_at",
      )
      .eq("workspace_id", workspaceId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toApiKey);
  }
  const sql = getNeon();
  if (!sql) return null;
  const rows = await sql`
    select id, workspace_id, prefix, hash, name, scopes, created_at, expires_at, last_used_at, revoked_at
    from api_keys where workspace_id = ${workspaceId} and revoked_at is null order by created_at desc
  `;
  return (rows as StoredApiKeyRow[]).map(toApiKey);
}

export async function findPersistedApiKeysByPrefix(prefix: string): Promise<ApiKey[] | null> {
  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("api_keys")
      .select(
        "id, workspace_id, prefix, hash, name, scopes, created_at, expires_at, last_used_at, revoked_at",
      )
      .eq("prefix", prefix)
      .is("revoked_at", null);
    if (error) throw error;
    return (data ?? []).map(toApiKey);
  }
  const sql = getNeon();
  if (!sql) return null;
  const rows = await sql`
    select id, workspace_id, prefix, hash, name, scopes, created_at, expires_at, last_used_at, revoked_at
    from api_keys where prefix = ${prefix} and revoked_at is null
  `;
  return (rows as StoredApiKeyRow[]).map(toApiKey);
}

export async function touchPersistedApiKey(id: string): Promise<void> {
  const supabase = await getSupabase();
  if (supabase) {
    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", id)
      .is("revoked_at", null);
    return;
  }
  const sql = getNeon();
  if (sql)
    await sql`update api_keys set last_used_at = now() where id = ${id} and revoked_at is null`;
}

export async function revokePersistedApiKey(id: string, workspaceId: string): Promise<boolean> {
  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .is("revoked_at", null)
      .select("id");
    if (error) throw error;
    return Boolean(data?.length);
  }
  const sql = getNeon();
  if (!sql) return false;
  const rows = await sql`
    update api_keys set revoked_at = now() where id = ${id} and workspace_id = ${workspaceId} and revoked_at is null returning id
  `;
  return Boolean((rows as { id: string }[]).length);
}
