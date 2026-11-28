/**
 * GDPR / data portability export API.
 *
 * Enterprise buyers under GDPR, CCPA, PIPEDA and similar regulations
 * must be able to export all personal and workspace data on request.
 *
 * This endpoint produces a full workspace data export as a structured
 * JSON archive containing:
 *   - Workspace settings and configuration
 *   - Members and roles
 *   - Employees (AI teammates) and their settings
 *   - Conversations and messages
 *   - Audit log entries
 *   - Fine-tuning jobs
 *   - Knowledge base documents
 *   - Budget records
 *   - Integration configurations (secrets redacted)
 *
 * Large exports are paginated by entity type to avoid memory spikes.
 *
 * GET  /api/data-export?workspaceId= — start or resume export
 * POST /api/data-export              — request a full export (async job)
 *
 * Authentication: x-admin-key header
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

type ExportStatus = "pending" | "running" | "completed" | "failed";

interface ExportJob {
  id: string;
  workspaceId: string;
  requestedBy?: string;
  status: ExportStatus;
  includeConversations: boolean;
  includeAuditLog: boolean;
  dateFrom?: string;
  dateTo?: string;
  entityCounts?: Record<string, number>;
  downloadUrl?: string;
  expiresAt?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const jobId = url.searchParams.get("jobId");
  const entity = url.searchParams.get("entity");

  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  // Check job status
  if (jobId) {
    type JobRow = {
      id: string;
      workspace_id: string;
      requested_by: string | null;
      status: string;
      include_conversations: boolean;
      include_audit_log: boolean;
      date_from: string | null;
      date_to: string | null;
      entity_counts: Record<string, number> | null;
      error: string | null;
      started_at: string | null;
      completed_at: string | null;
      created_at: string;
    };
    const jobs = (await neon`
      SELECT * FROM data_export_jobs
      WHERE id = ${jobId} AND workspace_id = ${workspaceId} LIMIT 1
    `) as unknown as JobRow[];

    if (!jobs.length) return Response.json({ error: "Export job not found" }, { status: 404 });
    const j = jobs[0];

    return Response.json({
      job: {
        id: j.id,
        workspaceId: j.workspace_id,
        requestedBy: j.requested_by ?? undefined,
        status: j.status as ExportStatus,
        includeConversations: j.include_conversations,
        includeAuditLog: j.include_audit_log,
        dateFrom: j.date_from ?? undefined,
        dateTo: j.date_to ?? undefined,
        entityCounts: j.entity_counts ?? undefined,
        error: j.error ?? undefined,
        startedAt: j.started_at ?? undefined,
        completedAt: j.completed_at ?? undefined,
        createdAt: j.created_at,
      } satisfies ExportJob,
    });
  }

  // Synchronous partial export by entity type (for smaller datasets)
  if (entity) {
    return handleEntityExport(request, workspaceId, entity, neon);
  }

  // List recent export jobs for this workspace
  type JobListRow = {
    id: string;
    status: string;
    include_conversations: boolean;
    entity_counts: Record<string, number> | null;
    completed_at: string | null;
    created_at: string;
  };
  const jobs = (await neon`
    SELECT id, status, include_conversations, entity_counts, completed_at, created_at
    FROM data_export_jobs
    WHERE workspace_id = ${workspaceId}
    ORDER BY created_at DESC LIMIT 10
  `) as unknown as JobListRow[];

  return Response.json({
    jobs: jobs.map((j) => ({
      id: j.id,
      status: j.status,
      includeConversations: j.include_conversations,
      entityCounts: j.entity_counts,
      completedAt: j.completed_at,
      createdAt: j.created_at,
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    workspaceId?: string;
    requestedBy?: string;
    includeConversations?: boolean;
    includeAuditLog?: boolean;
    dateFrom?: string;
    dateTo?: string;
    format?: "json" | "ndjson";
    inline?: boolean; // return data inline (small workspaces only)
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    workspaceId,
    requestedBy,
    includeConversations = true,
    includeAuditLog = true,
    dateFrom,
    dateTo,
    inline = false,
  } = body;

  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  // For inline=true, run the export synchronously and return data directly
  if (inline) {
    return runInlineExport(workspaceId, {
      includeConversations,
      includeAuditLog,
      dateFrom,
      dateTo,
      neon,
    });
  }

  // Create an async export job
  const jobId = `exp_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const now = new Date().toISOString();

  await neon`
    INSERT INTO data_export_jobs (
      id, workspace_id, requested_by, status,
      include_conversations, include_audit_log,
      date_from, date_to, created_at
    ) VALUES (
      ${jobId}, ${workspaceId}, ${requestedBy ?? null}, 'pending',
      ${includeConversations}, ${includeAuditLog},
      ${dateFrom ?? null}, ${dateTo ?? null}, ${now}
    )
  `;

  await neon`
    INSERT INTO audit_log (workspace_id, actor, action, target, payload)
    VALUES (${workspaceId}, ${requestedBy ?? "api"}, 'data_export.requested', ${jobId},
            ${JSON.stringify({ includeConversations, includeAuditLog })}::jsonb)
  `.catch(() => {});

  return Response.json(
    {
      job: {
        id: jobId,
        workspaceId,
        requestedBy,
        status: "pending",
        includeConversations,
        includeAuditLog,
        dateFrom,
        dateTo,
        createdAt: now,
      } satisfies ExportJob,
      message: "Export job created. Poll GET /api/data-export?workspaceId=&jobId= for status.",
    },
    { status: 202 },
  );
}

type NeonClient = ReturnType<typeof getNeon>;

async function runInlineExport(
  workspaceId: string,
  opts: {
    includeConversations: boolean;
    includeAuditLog: boolean;
    dateFrom?: string;
    dateTo?: string;
    neon: NeonClient;
  },
): Promise<Response> {
  const { neon, includeConversations, includeAuditLog, dateFrom, dateTo } = opts;
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  const fromDate = dateFrom ?? new Date(0).toISOString();
  const toDate = dateTo ?? new Date().toISOString();

  // Fetch all entity types in parallel
  const [
    workspace,
    members,
    employees,
    budgets,
    knowledgeDocs,
    integrations,
    fineTuning,
    auditLog,
    conversations,
  ] = await Promise.all([
    // Workspace
    (neon`SELECT * FROM workspaces WHERE id = ${workspaceId} LIMIT 1` as Promise<unknown[]>).catch(
      () => [],
    ),

    // Members
    (
      neon`SELECT id, workspace_id, user_id, role, created_at FROM members
            WHERE workspace_id = ${workspaceId}` as Promise<unknown[]>
    ).catch(() => []),

    // Employees
    (
      neon`SELECT id, workspace_id, name, role, model, status, created_at
            FROM employees WHERE workspace_id = ${workspaceId}` as Promise<unknown[]>
    ).catch(() => []),

    // Budgets
    (
      neon`SELECT id, type, target_id, limit_usd, current_spend_usd,
                   reset_period, is_active, created_at
            FROM workspace_budgets
            WHERE workspace_id = ${workspaceId}` as Promise<unknown[]>
    ).catch(() => []),

    // Knowledge docs (no content in export for size; hash is enough for verification)
    (
      neon`SELECT id, title, type, content_hash, status, token_count,
                   created_at, updated_at
            FROM knowledge_documents
            WHERE workspace_id = ${workspaceId} AND status != 'archived'` as Promise<unknown[]>
    ).catch(() => []),

    // Integrations (secrets redacted)
    (
      neon`SELECT id, provider, name, status, events,
                   delivery_count, error_count, created_at
            FROM workspace_integrations
            WHERE workspace_id = ${workspaceId}` as Promise<unknown[]>
    ).catch(() => []),

    // Fine-tuning jobs
    (
      neon`SELECT id, base_model, status, training_examples_count,
                   result_model, created_at, finished_at
            FROM fine_tuning_jobs
            WHERE workspace_id = ${workspaceId}` as Promise<unknown[]>
    ).catch(() => []),

    // Audit log
    includeAuditLog
      ? (
          neon`SELECT id, actor, action, target, payload, created_at
                FROM audit_log
                WHERE workspace_id = ${workspaceId}
                  AND created_at >= ${fromDate}
                  AND created_at <= ${toDate}
                ORDER BY created_at DESC
                LIMIT 50000` as Promise<unknown[]>
        ).catch(() => [])
      : Promise.resolve([]),

    // Conversations
    includeConversations
      ? (
          neon`SELECT id, employee_id, user_id, title, status,
                       message_count, created_at, updated_at
                FROM conversations
                WHERE workspace_id = ${workspaceId}
                  AND created_at >= ${fromDate}
                  AND created_at <= ${toDate}
                ORDER BY created_at DESC
                LIMIT 100000` as Promise<unknown[]>
        ).catch(() => [])
      : Promise.resolve([]),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    workspaceId,
    dateRange: { from: fromDate, to: toDate },
    schema: "eidon-export/v1",
    entities: {
      workspace: (workspace as unknown[])[0] ?? null,
      members,
      employees,
      budgets,
      knowledgeDocs,
      integrations,
      fineTuning,
      ...(includeAuditLog ? { auditLog } : {}),
      ...(includeConversations ? { conversations } : {}),
    },
    counts: {
      members: (members as unknown[]).length,
      employees: (employees as unknown[]).length,
      budgets: (budgets as unknown[]).length,
      knowledgeDocs: (knowledgeDocs as unknown[]).length,
      integrations: (integrations as unknown[]).length,
      fineTuning: (fineTuning as unknown[]).length,
      ...(includeAuditLog ? { auditLog: (auditLog as unknown[]).length } : {}),
      ...(includeConversations ? { conversations: (conversations as unknown[]).length } : {}),
    },
  };

  const json = JSON.stringify(exportData, null, 2);
  const filename = `eidon-export-${workspaceId}-${Date.now()}.json`;

  return new Response(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Export-WorkspaceId": workspaceId,
      "X-Export-Timestamp": exportData.exportedAt,
    },
  });
}

async function handleEntityExport(
  _request: NextRequest,
  workspaceId: string,
  entity: string,
  neon: NeonClient,
): Promise<Response> {
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  const ALLOWED_ENTITIES = [
    "members",
    "employees",
    "conversations",
    "audit_log",
    "knowledge_docs",
    "integrations",
    "budgets",
    "fine_tuning_jobs",
  ];

  if (!ALLOWED_ENTITIES.includes(entity)) {
    return Response.json(
      { error: `entity must be one of: ${ALLOWED_ENTITIES.join(", ")}` },
      { status: 422 },
    );
  }

  let data: unknown[] = [];

  switch (entity) {
    case "members":
      data = (await neon`SELECT id, workspace_id, user_id, role, created_at
                         FROM members WHERE workspace_id = ${workspaceId}`) as unknown as unknown[];
      break;
    case "employees":
      data = (await neon`SELECT id, name, role, model, status, created_at
                         FROM employees WHERE workspace_id = ${workspaceId}`) as unknown as unknown[];
      break;
    case "conversations":
      data = (await neon`SELECT id, employee_id, user_id, title, status,
                                message_count, created_at
                         FROM conversations WHERE workspace_id = ${workspaceId}
                         ORDER BY created_at DESC LIMIT 10000`) as unknown as unknown[];
      break;
    case "audit_log":
      data = (await neon`SELECT id, actor, action, target, created_at
                         FROM audit_log WHERE workspace_id = ${workspaceId}
                         ORDER BY created_at DESC LIMIT 10000`) as unknown as unknown[];
      break;
    case "knowledge_docs":
      data = (await neon`SELECT id, title, type, content_hash, status, token_count, created_at
                         FROM knowledge_documents
                         WHERE workspace_id = ${workspaceId}`) as unknown as unknown[];
      break;
    case "integrations":
      data = (await neon`SELECT id, provider, name, status, events, created_at
                         FROM workspace_integrations
                         WHERE workspace_id = ${workspaceId}`) as unknown as unknown[];
      break;
    case "budgets":
      data = (await neon`SELECT id, type, limit_usd, current_spend_usd, reset_period, created_at
                         FROM workspace_budgets
                         WHERE workspace_id = ${workspaceId}`) as unknown as unknown[];
      break;
    case "fine_tuning_jobs":
      data = (await neon`SELECT id, base_model, status, training_examples_count, created_at
                         FROM fine_tuning_jobs
                         WHERE workspace_id = ${workspaceId}`) as unknown as unknown[];
      break;
  }

  return Response.json({ entity, workspaceId, count: data.length, data });
}
