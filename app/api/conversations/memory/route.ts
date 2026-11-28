/**
 * Conversation memory API — persistent context across sessions.
 *
 * Enterprise buyers need AI employees to remember:
 *   - User preferences expressed in past sessions
 *   - Ongoing project context (terminology, decisions, stakeholders)
 *   - Relationship history (last discussed, recurring issues)
 *
 * Memory is stored per (workspace, employee, user) triple and injected
 * as a system-prompt prefix at conversation start.
 *
 * GET  /api/conversations/memory  — retrieve memories for a session
 * POST /api/conversations/memory  — upsert a memory entry
 * DELETE /api/conversations/memory?memoryId= — remove a specific memory
 *
 * Memory types:
 *   - fact: discrete factual statement about the user or project
 *   - preference: user-stated preference
 *   - context: ongoing project/task context
 *   - instruction: persistent instruction for the AI employee
 */

import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdminKey(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  return key === expected;
}

export type MemoryType = "fact" | "preference" | "context" | "instruction";

export interface MemoryEntry {
  id: string;
  workspaceId: string;
  employeeId: string;
  userId?: string;
  type: MemoryType;
  content: string;
  /** Tags for filtering/grouping (e.g. ["project:apollo", "technical"]) */
  tags?: string[];
  /** Confidence score 0–1; lower confidence entries may be omitted under token pressure */
  confidence: number;
  /** Number of times this memory was reinforced by subsequent conversations */
  reinforcementCount: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

const VALID_TYPES: MemoryType[] = ["fact", "preference", "context", "instruction"];

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const employeeId = url.searchParams.get("employeeId");
  const userId = url.searchParams.get("userId");
  const type = url.searchParams.get("type") as MemoryType | null;
  const tag = url.searchParams.get("tag");
  const minConfidence = parseFloat(url.searchParams.get("minConfidence") ?? "0");

  if (!workspaceId || !employeeId) {
    return Response.json({ error: "workspaceId and employeeId are required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  type Row = {
    id: string;
    workspace_id: string;
    employee_id: string;
    user_id: string | null;
    type: string;
    content: string;
    tags: string[] | null;
    confidence: number;
    reinforcement_count: number;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
  };

  const now = new Date().toISOString();
  let rows: Row[];

  if (userId && type) {
    rows = (await neon`
      SELECT * FROM conversation_memory
      WHERE workspace_id = ${workspaceId}
        AND employee_id = ${employeeId}
        AND (user_id = ${userId} OR user_id IS NULL)
        AND type = ${type}
        AND confidence >= ${minConfidence}
        AND (expires_at IS NULL OR expires_at > ${now})
      ORDER BY confidence DESC, reinforcement_count DESC, updated_at DESC
    `) as unknown as Row[];
  } else if (userId) {
    rows = (await neon`
      SELECT * FROM conversation_memory
      WHERE workspace_id = ${workspaceId}
        AND employee_id = ${employeeId}
        AND (user_id = ${userId} OR user_id IS NULL)
        AND confidence >= ${minConfidence}
        AND (expires_at IS NULL OR expires_at > ${now})
      ORDER BY confidence DESC, reinforcement_count DESC, updated_at DESC
    `) as unknown as Row[];
  } else {
    rows = (await neon`
      SELECT * FROM conversation_memory
      WHERE workspace_id = ${workspaceId}
        AND employee_id = ${employeeId}
        AND confidence >= ${minConfidence}
        AND (expires_at IS NULL OR expires_at > ${now})
      ORDER BY confidence DESC, reinforcement_count DESC, updated_at DESC
    `) as unknown as Row[];
  }

  // Client-side tag filter (simple, avoids complex SQL for jsonb array containment portability)
  const memories = rows
    .filter((r) => !tag || (Array.isArray(r.tags) && r.tags.includes(tag)))
    .map(formatMemory);

  // Build a compact system-prompt-ready string for the calling system
  const promptContext = memories
    .slice(0, 20) // cap injected memories to avoid token bloat
    .map((m) => `[${m.type.toUpperCase()}] ${m.content}`)
    .join("\n");

  return Response.json({ memories, promptContext, count: memories.length });
}

export async function POST(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    workspaceId?: string;
    employeeId?: string;
    userId?: string;
    type?: MemoryType;
    content?: string;
    tags?: string[];
    confidence?: number;
    expiresAt?: string;
    reinforce?: boolean;
    existingId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workspaceId, employeeId, type, content, confidence = 0.8 } = body;

  if (!workspaceId || !employeeId || !type || !content) {
    return Response.json(
      { error: "workspaceId, employeeId, type, and content are required" },
      { status: 400 },
    );
  }

  if (!VALID_TYPES.includes(type)) {
    return Response.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 422 },
    );
  }

  if (confidence < 0 || confidence > 1) {
    return Response.json({ error: "confidence must be between 0 and 1" }, { status: 422 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  const now = new Date().toISOString();

  // If reinforce=true and existingId provided, increment reinforcement count
  if (body.reinforce && body.existingId) {
    const newConfidence = Math.min(1.0, confidence + 0.05);
    await neon`
      UPDATE conversation_memory
      SET reinforcement_count = reinforcement_count + 1,
          confidence = ${newConfidence},
          updated_at = ${now}
      WHERE id = ${body.existingId}
        AND workspace_id = ${workspaceId}
        AND employee_id = ${employeeId}
    `;
    return Response.json({ id: body.existingId, reinforced: true, updatedAt: now });
  }

  const memoryId = `mem_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const tags = Array.isArray(body.tags) ? body.tags : [];

  await neon`
    INSERT INTO conversation_memory (
      id, workspace_id, employee_id, user_id, type, content,
      tags, confidence, reinforcement_count, expires_at, created_at, updated_at
    ) VALUES (
      ${memoryId}, ${workspaceId}, ${employeeId}, ${body.userId ?? null},
      ${type}, ${content}, ${JSON.stringify(tags)}::jsonb,
      ${confidence}, 0, ${body.expiresAt ?? null}, ${now}, ${now}
    )
  `;

  return Response.json(
    {
      memory: {
        id: memoryId,
        workspaceId,
        employeeId,
        userId: body.userId,
        type,
        content,
        tags,
        confidence,
        reinforcementCount: 0,
        expiresAt: body.expiresAt,
        createdAt: now,
        updatedAt: now,
      } satisfies MemoryEntry,
    },
    { status: 201 },
  );
}

export async function DELETE(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const memoryId = url.searchParams.get("memoryId");
  const workspaceId = url.searchParams.get("workspaceId");

  if (!memoryId || !workspaceId) {
    return Response.json({ error: "memoryId and workspaceId are required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  type Row = { id: string };
  const rows = (await neon`
    DELETE FROM conversation_memory
    WHERE id = ${memoryId} AND workspace_id = ${workspaceId}
    RETURNING id
  `) as unknown as Row[];

  if (!rows.length) {
    return Response.json({ error: "Memory not found" }, { status: 404 });
  }

  return Response.json({ deleted: true, id: memoryId });
}

type RawRow = {
  id: string;
  workspace_id: string;
  employee_id: string;
  user_id: string | null;
  type: string;
  content: string;
  tags: string[] | null;
  confidence: number;
  reinforcement_count: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

function formatMemory(row: RawRow): MemoryEntry {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    employeeId: row.employee_id,
    userId: row.user_id ?? undefined,
    type: row.type as MemoryType,
    content: row.content,
    tags: row.tags ?? undefined,
    confidence: row.confidence,
    reinforcementCount: row.reinforcement_count,
    expiresAt: row.expires_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
