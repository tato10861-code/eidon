/**
 * API key management for the Eidon enterprise tier.
 *
 * Keys are structured as `ek_{prefix}_{secret}` where:
 *   - `prefix` is a 6-char hex workspace identifier (stable, shown in dashboards)
 *   - `secret` is 24 random bytes base64url-encoded (never stored in plaintext)
 *
 * Only the SHA-256 hash of the full key is stored server-side. This module
 * provides pure, side-effect-free helpers; persistence is the caller's concern.
 */

const KEY_PREFIX = "ek_";

export interface ApiKey {
  id: string;
  workspaceId: string;
  prefix: string;
  hash: string;
  name: string;
  scopes: ApiKeyScope[];
  createdAt: number;
  expiresAt: number | null;
  lastUsedAt: number | null;
  rateLimit: number;
}

export type ApiKeyScope =
  | "chat:read"
  | "chat:write"
  | "employees:read"
  | "conversations:read"
  | "conversations:write"
  | "export:read"
  | "usage:read"
  | "admin";

export interface GeneratedKey {
  key: string;
  prefix: string;
  hash: string;
}

/** Generate a new API key. The returned `key` must be shown once and not stored. */
export async function generateApiKey(workspaceId: string): Promise<GeneratedKey> {
  const prefixBytes = workspaceId.slice(0, 6).padStart(6, "0");
  const secretBytes = crypto.getRandomValues(new Uint8Array(24));
  const secret = btoa(String.fromCharCode(...secretBytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const key = `${KEY_PREFIX}${prefixBytes}_${secret}`;
  const hash = await hashApiKey(key);

  return { key, prefix: prefixBytes, hash };
}

/** SHA-256 hash of a full API key. Constant-time safe for storage comparison. */
export async function hashApiKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Extract the prefix from a key string without validating it. */
export function extractPrefix(key: string): string | null {
  if (!key.startsWith(KEY_PREFIX)) return null;
  const parts = key.slice(KEY_PREFIX.length).split("_");
  return parts[0] ?? null;
}

/** Validate a raw key string against a stored hash. */
export async function verifyApiKey(raw: string, storedHash: string): Promise<boolean> {
  const hash = await hashApiKey(raw);
  if (hash.length !== storedHash.length) return false;
  // Constant-time comparison
  let diff = 0;
  for (let i = 0; i < hash.length; i++) {
    diff |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}

/** Parse the Authorization header and return the raw key, or null. */
export function extractBearerKey(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(ek_\S+)$/i);
  return match?.[1] ?? null;
}

/** True if the key's scope list covers the required scope. */
export function hasScope(key: ApiKey, required: ApiKeyScope): boolean {
  return key.scopes.includes("admin") || key.scopes.includes(required);
}
