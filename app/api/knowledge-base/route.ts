/**
 * Knowledge base management API.
 *
 * Enterprise AI employees need grounding in company-specific knowledge.
 * This endpoint manages documents, FAQs, and policies that employees
 * use for RAG (Retrieval-Augmented Generation).
 *
 * Features:
 *   - Document upload (text, markdown, structured data)
 *   - Chunk tracking for vector-store synchronization
 *   - Per-employee or workspace-wide knowledge scoping
 *   - Version history and soft-deletion
 *   - Source attribution in AI responses
 *
 * GET    /api/knowledge-base?workspaceId= — list documents
 * POST   /api/knowledge-base              — create/update document
 * DELETE /api/knowledge-base?id=          — archive document
 */

import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import { randomUUID } from "crypto";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdminKey(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  return key === expected;
}

export type DocumentType =
  | "text"
  | "markdown"
  | "faq"
  | "policy"
  | "procedure"
  | "product"
  | "support"
  | "code"
  | "json"
  | "csv";

export type DocumentStatus = "active" | "processing" | "archived" | "failed";

export interface KnowledgeDocument {
  id: string;
  workspaceId: string;
  employeeId?: string; // null = shared across all employees
  title: string;
  type: DocumentType;
  content: string;
  contentHash: string;
  status: DocumentStatus;
  tags?: string[];
  metadata?: Record<string, unknown>;
  sourceUrl?: string;
  chunkCount?: number;
  tokenCount?: number;
  version: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

const VALID_TYPES: DocumentType[] = [
  "text",
  "markdown",
  "faq",
  "policy",
  "procedure",
  "product",
  "support",
  "code",
  "json",
  "csv",
];

const MAX_CONTENT_BYTES = 2 * 1024 * 1024; // 2 MB per document

// Rough token estimate: 4 chars ≈ 1 token
function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

// Rough chunk count: ~400 tokens per chunk with 50-token overlap
function estimateChunks(tokenCount: number): number {
  if (tokenCount <= 400) return 1;
  return Math.ceil(tokenCount / 350);
}

type Row = {
  id: string;
  workspace_id: string;
  employee_id: string | null;
  title: string;
  type: string;
  content: string;
  content_hash: string;
  status: string;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  source_url: string | null;
  chunk_count: number | null;
  token_count: number | null;
  version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

function formatRow(r: Row, includeContent = false): KnowledgeDocument {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    employeeId: r.employee_id ?? undefined,
    title: r.title,
    type: r.type as DocumentType,
    content: includeContent
      ? r.content
      : `[${r.token_count ?? 0} tokens — fetch with ?id= for content]`,
    contentHash: r.content_hash,
    status: r.status as DocumentStatus,
    tags: r.tags ?? undefined,
    metadata: r.metadata ?? undefined,
    sourceUrl: r.source_url ?? undefined,
    chunkCount: r.chunk_count ?? undefined,
    tokenCount: r.token_count ?? undefined,
    version: r.version,
    createdBy: r.created_by ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    archivedAt: r.archived_at ?? undefined,
  };
}

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const docId = url.searchParams.get("id");
  const employeeId = url.searchParams.get("employeeId");
  const type = url.searchParams.get("type") as DocumentType | null;
  const status = url.searchParams.get("status") ?? "active";
  const search = url.searchParams.get("search");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 500);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

  if (!workspaceId && !docId) {
    return Response.json({ error: "workspaceId or id is required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  // Single doc fetch — returns full content
  if (docId) {
    const rows = (await neon`
      SELECT * FROM knowledge_documents WHERE id = ${docId} LIMIT 1
    `) as unknown as Row[];
    if (!rows.length) return Response.json({ error: "Document not found" }, { status: 404 });
    return Response.json({ document: formatRow(rows[0], true) });
  }

  // List — omit content for performance; callers fetch individual docs for content
  type CountRow = { count: string };

  let rows: Row[];
  let countRows: CountRow[];

  if (search) {
    // Simple substring search — in production this would hit the vector store
    const searchPat = `%${search}%`;
    rows = (await neon`
      SELECT id, workspace_id, employee_id, title, type, content_hash, status,
             tags, metadata, source_url, chunk_count, token_count,
             version, created_by, created_at, updated_at, archived_at,
             '' AS content
      FROM knowledge_documents
      WHERE workspace_id = ${workspaceId!}
        AND status = ${status}
        AND (title ILIKE ${searchPat} OR content ILIKE ${searchPat})
      ORDER BY updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as unknown as Row[];
    countRows = (await neon`
      SELECT COUNT(*)::text FROM knowledge_documents
      WHERE workspace_id = ${workspaceId!} AND status = ${status}
        AND (title ILIKE ${searchPat} OR content ILIKE ${searchPat})
    `) as unknown as CountRow[];
  } else if (employeeId && type) {
    rows = (await neon`
      SELECT id, workspace_id, employee_id, title, type, content_hash, status,
             tags, metadata, source_url, chunk_count, token_count,
             version, created_by, created_at, updated_at, archived_at,
             '' AS content
      FROM knowledge_documents
      WHERE workspace_id = ${workspaceId!}
        AND (employee_id = ${employeeId} OR employee_id IS NULL)
        AND type = ${type} AND status = ${status}
      ORDER BY updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as unknown as Row[];
    countRows = (await neon`
      SELECT COUNT(*)::text FROM knowledge_documents
      WHERE workspace_id = ${workspaceId!}
        AND (employee_id = ${employeeId} OR employee_id IS NULL)
        AND type = ${type} AND status = ${status}
    `) as unknown as CountRow[];
  } else if (employeeId) {
    rows = (await neon`
      SELECT id, workspace_id, employee_id, title, type, content_hash, status,
             tags, metadata, source_url, chunk_count, token_count,
             version, created_by, created_at, updated_at, archived_at,
             '' AS content
      FROM knowledge_documents
      WHERE workspace_id = ${workspaceId!}
        AND (employee_id = ${employeeId} OR employee_id IS NULL)
        AND status = ${status}
      ORDER BY updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as unknown as Row[];
    countRows = (await neon`
      SELECT COUNT(*)::text FROM knowledge_documents
      WHERE workspace_id = ${workspaceId!}
        AND (employee_id = ${employeeId} OR employee_id IS NULL)
        AND status = ${status}
    `) as unknown as CountRow[];
  } else if (type) {
    rows = (await neon`
      SELECT id, workspace_id, employee_id, title, type, content_hash, status,
             tags, metadata, source_url, chunk_count, token_count,
             version, created_by, created_at, updated_at, archived_at,
             '' AS content
      FROM knowledge_documents
      WHERE workspace_id = ${workspaceId!} AND type = ${type} AND status = ${status}
      ORDER BY updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as unknown as Row[];
    countRows = (await neon`
      SELECT COUNT(*)::text FROM knowledge_documents
      WHERE workspace_id = ${workspaceId!} AND type = ${type} AND status = ${status}
    `) as unknown as CountRow[];
  } else {
    rows = (await neon`
      SELECT id, workspace_id, employee_id, title, type, content_hash, status,
             tags, metadata, source_url, chunk_count, token_count,
             version, created_by, created_at, updated_at, archived_at,
             '' AS content
      FROM knowledge_documents
      WHERE workspace_id = ${workspaceId!} AND status = ${status}
      ORDER BY updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as unknown as Row[];
    countRows = (await neon`
      SELECT COUNT(*)::text FROM knowledge_documents
      WHERE workspace_id = ${workspaceId!} AND status = ${status}
    `) as unknown as CountRow[];
  }

  const documents = rows.map((r) => formatRow(r, false));
  const total = parseInt(countRows[0]?.count ?? "0", 10);

  return Response.json({
    documents,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + documents.length < total,
    },
    summary: {
      totalTokens: documents.reduce((s, d) => s + (d.tokenCount ?? 0), 0),
      totalChunks: documents.reduce((s, d) => s + (d.chunkCount ?? 0), 0),
    },
  });
}

export async function POST(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    workspaceId?: string;
    employeeId?: string | null;
    title?: string;
    type?: DocumentType;
    content?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    sourceUrl?: string;
    createdBy?: string;
    updateId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workspaceId, title, type, content, updateId } = body;

  if (!workspaceId || !title || !type || !content) {
    return Response.json(
      { error: "workspaceId, title, type, and content are required" },
      { status: 400 },
    );
  }

  if (!VALID_TYPES.includes(type)) {
    return Response.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 422 },
    );
  }

  if (Buffer.byteLength(content, "utf8") > MAX_CONTENT_BYTES) {
    return Response.json(
      { error: `content exceeds 2 MB limit (${(MAX_CONTENT_BYTES / 1024 / 1024).toFixed(1)} MB)` },
      { status: 413 },
    );
  }

  const neon = getNeon();
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  const contentHash = createHash("sha256").update(content).digest("hex").slice(0, 16);
  const tokenCount = estimateTokens(content);
  const chunkCount = estimateChunks(tokenCount);
  const now = new Date().toISOString();
  const tags = Array.isArray(body.tags) ? body.tags : [];

  if (updateId) {
    // Check if content actually changed before bumping version
    type HashRow = { content_hash: string; version: number };
    const existing = (await neon`
      SELECT content_hash, version FROM knowledge_documents WHERE id = ${updateId} LIMIT 1
    `) as unknown as HashRow[];

    if (!existing.length) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    const contentChanged = existing[0].content_hash !== contentHash;
    const newVersion = contentChanged ? existing[0].version + 1 : existing[0].version;

    await neon`
      UPDATE knowledge_documents
      SET title = ${title},
          type = ${type},
          content = ${content},
          content_hash = ${contentHash},
          token_count = ${tokenCount},
          chunk_count = ${chunkCount},
          tags = ${JSON.stringify(tags)}::jsonb,
          metadata = ${JSON.stringify(body.metadata ?? {})}::jsonb,
          source_url = ${body.sourceUrl ?? null},
          version = ${newVersion},
          status = 'processing',
          updated_at = ${now}
      WHERE id = ${updateId} AND workspace_id = ${workspaceId}
    `;

    return Response.json({ id: updateId, updated: true, contentChanged, version: newVersion });
  }

  const docId = `doc_${randomUUID().replace(/-/g, "").slice(0, 20)}`;

  await neon`
    INSERT INTO knowledge_documents (
      id, workspace_id, employee_id, title, type, content, content_hash,
      status, tags, metadata, source_url,
      chunk_count, token_count, version, created_by,
      created_at, updated_at
    ) VALUES (
      ${docId}, ${workspaceId}, ${body.employeeId ?? null},
      ${title}, ${type}, ${content}, ${contentHash},
      'processing',
      ${JSON.stringify(tags)}::jsonb,
      ${JSON.stringify(body.metadata ?? {})}::jsonb,
      ${body.sourceUrl ?? null},
      ${chunkCount}, ${tokenCount}, 1, ${body.createdBy ?? null},
      ${now}, ${now}
    )
  `;

  await neon`
    INSERT INTO audit_log (workspace_id, actor, action, target, payload)
    VALUES (${workspaceId}, ${body.createdBy ?? "api"}, 'knowledge.created', ${docId},
            ${JSON.stringify({ title, type, tokenCount })}::jsonb)
  `.catch(() => {});

  return Response.json(
    {
      document: {
        id: docId,
        workspaceId,
        employeeId: body.employeeId ?? undefined,
        title,
        type,
        content,
        contentHash,
        status: "processing" as DocumentStatus,
        tags,
        metadata: body.metadata,
        sourceUrl: body.sourceUrl,
        chunkCount,
        tokenCount,
        version: 1,
        createdBy: body.createdBy,
        createdAt: now,
        updatedAt: now,
      } satisfies KnowledgeDocument,
    },
    { status: 201 },
  );
}

export async function DELETE(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const workspaceId = url.searchParams.get("workspaceId");
  const hard = url.searchParams.get("hard") === "true";

  if (!id || !workspaceId) {
    return Response.json({ error: "id and workspaceId are required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  const now = new Date().toISOString();

  if (hard) {
    type DelRow = { id: string; title: string };
    const rows = (await neon`
      DELETE FROM knowledge_documents
      WHERE id = ${id} AND workspace_id = ${workspaceId}
      RETURNING id, title
    `) as unknown as DelRow[];
    if (!rows.length) return Response.json({ error: "Document not found" }, { status: 404 });
    return Response.json({ deleted: true, id, title: rows[0].title });
  }

  // Soft-delete (archive)
  type ArchRow = { id: string; title: string };
  const rows = (await neon`
    UPDATE knowledge_documents
    SET status = 'archived', archived_at = ${now}, updated_at = ${now}
    WHERE id = ${id} AND workspace_id = ${workspaceId} AND status != 'archived'
    RETURNING id, title
  `) as unknown as ArchRow[];

  if (!rows.length) return Response.json({ error: "Document not found" }, { status: 404 });

  return Response.json({ archived: true, id, title: rows[0].title });
}
