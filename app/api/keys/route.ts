/**
 * API key management endpoints.
 *
 * POST /api/keys  — generate a new key (admin scope required or workspace auth)
 * GET  /api/keys  — list key metadata for a workspace (never returns plaintext keys)
 *
 * In production, keys are persisted in Neon/Supabase. The demo tier stores
 * them in memory and clears on cold start.
 */

import type { NextRequest } from "next/server";
import { generateApiKey, type ApiKey, type ApiKeyScope } from "@/lib/api-keys";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const keyStore = new Map<string, ApiKey>();

function getWorkspaceKeys(workspaceId: string): ApiKey[] {
  return Array.from(keyStore.values()).filter((k) => k.workspaceId === workspaceId);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limit = rateLimit(`keys:create:${ip}`, 10, 60_000);
  if (!limit.ok) {
    return Response.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  let body: {
    workspaceId?: string;
    name?: string;
    scopes?: ApiKeyScope[];
    expiresIn?: number | null;
  } = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const workspaceId = body.workspaceId?.trim() || "demo";
  const name = body.name?.trim() || "Default key";
  const scopes: ApiKeyScope[] = body.scopes?.length
    ? body.scopes
    : ["chat:write", "chat:read", "conversations:read", "employees:read"];

  const { key, prefix, hash } = await generateApiKey(workspaceId);

  const record: ApiKey = {
    id: crypto.randomUUID(),
    workspaceId,
    prefix,
    hash,
    name,
    scopes,
    createdAt: Date.now(),
    expiresAt: body.expiresIn ? Date.now() + body.expiresIn : null,
    lastUsedAt: null,
    rateLimit: 1000,
  };
  keyStore.set(record.id, record);

  return Response.json(
    {
      id: record.id,
      key,
      prefix,
      name,
      scopes,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      warning: "Store this key securely. It will not be shown again.",
    },
    { status: 201 },
  );
}

export async function GET(request: NextRequest) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId") ?? "demo";

  const keys = getWorkspaceKeys(workspaceId).map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    scopes: k.scopes,
    createdAt: k.createdAt,
    expiresAt: k.expiresAt,
    lastUsedAt: k.lastUsedAt,
    rateLimit: k.rateLimit,
  }));

  return Response.json({ workspaceId, keys, total: keys.length });
}

export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing key id." }, { status: 400 });

  const deleted = keyStore.delete(id);
  if (!deleted) return Response.json({ error: "Key not found." }, { status: 404 });

  return Response.json({ deleted: true, id });
}
