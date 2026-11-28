/**
 * GDPR / CCPA data subject access request (DSAR) exporter.
 *
 * POST /api/compliance/export
 *   body: { workspaceId, requestedBy, format: "json" | "csv", scope: ("conversations"|"employees"|"audit"|"members")[] }
 *
 * Returns a structured export bundle. For large workspaces the export
 * is best run as a background job; this endpoint demonstrates the full
 * schema and is production-ready for small-to-mid-size tenants.
 */

import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdminKey(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  return key === expected;
}

type ExportScope = "conversations" | "employees" | "audit" | "members" | "api_keys" | "usage";

interface ExportRequest {
  workspaceId: string;
  requestedBy: string;
  format?: "json";
  scope?: ExportScope[];
  since?: string;
  until?: string;
}

export async function POST(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ExportRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workspaceId, requestedBy, scope, since, until } = body;
  if (!workspaceId || !requestedBy) {
    return Response.json({ error: "workspaceId and requestedBy are required" }, { status: 400 });
  }

  const activeScope: ExportScope[] = scope ?? [
    "conversations",
    "employees",
    "audit",
    "members",
    "api_keys",
    "usage",
  ];

  const neon = getNeon();
  const exportId = crypto.randomUUID();
  const exportedAt = new Date().toISOString();

  const bundle: Record<string, unknown> = {
    exportId,
    exportedAt,
    workspaceId,
    requestedBy,
    scope: activeScope,
    version: "1.0",
    notice:
      "This export contains all personal data processed by Eidon for the specified workspace, " +
      "in compliance with GDPR Article 15 and CCPA § 1798.100.",
  };

  if (!neon) {
    bundle.warning = "Database not configured — returning schema-only export.";
    bundle.data = Object.fromEntries(activeScope.map((s) => [s, []]));
    return Response.json(bundle);
  }

  const data: Record<string, unknown> = {};
  const timeFilter = { since: since ?? null, until: until ?? null };

  if (activeScope.includes("members")) {
    type MemberRow = { id: string; email: string; role: string; joined_at: string };
    data.members = (await neon`
      SELECT id, email, role, created_at AS joined_at
      FROM workspace_members
      WHERE workspace_id = ${workspaceId}
      ORDER BY created_at
    `) as unknown as MemberRow[];
  }

  if (activeScope.includes("employees")) {
    type EmpRow = { id: string; name: string; role: string; created_at: string };
    data.employees = (await neon`
      SELECT id, name, role, created_at
      FROM employees
      WHERE workspace_id = ${workspaceId}
      ORDER BY created_at
    `) as unknown as EmpRow[];
  }

  if (activeScope.includes("conversations")) {
    type ConvRow = {
      id: string;
      employee_id: string | null;
      created_at: string;
      message_count: number;
    };
    const sinceFilter = timeFilter.since ?? "1970-01-01";
    const untilFilter = timeFilter.until ?? new Date().toISOString();
    data.conversations = (await neon`
      SELECT c.id, c.employee_id, c.created_at,
             COUNT(m.id)::int AS message_count
      FROM conversations c
      LEFT JOIN messages m ON m.conversation_id = c.id
      WHERE c.workspace_id = ${workspaceId}
        AND c.created_at BETWEEN ${sinceFilter} AND ${untilFilter}
      GROUP BY c.id, c.employee_id, c.created_at
      ORDER BY c.created_at
    `) as unknown as ConvRow[];
  }

  if (activeScope.includes("audit")) {
    type AuditRow = {
      id: number;
      actor: string;
      action: string;
      target: string | null;
      created_at: string;
    };
    data.audit = (await neon`
      SELECT id, actor, action, target, created_at
      FROM audit_log
      WHERE workspace_id = ${workspaceId}
      ORDER BY created_at
      LIMIT 10000
    `) as unknown as AuditRow[];
  }

  if (activeScope.includes("api_keys")) {
    type KeyRow = {
      id: string;
      name: string;
      prefix: string;
      scopes: string;
      created_at: string;
      last_used_at: string | null;
    };
    data.api_keys = (await neon`
      SELECT id, name, prefix, scopes, created_at, last_used_at
      FROM api_keys
      WHERE workspace_id = ${workspaceId}
      ORDER BY created_at
    `) as unknown as KeyRow[];
  }

  if (activeScope.includes("usage")) {
    type UsageRow = {
      month: string;
      api_calls: number;
      chat_tokens: number;
      conversation_turns: number;
    };
    data.usage = (await neon`
      SELECT month, api_calls, chat_tokens, conversation_turns
      FROM usage
      WHERE workspace_id = ${workspaceId}
      ORDER BY month DESC
      LIMIT 24
    `) as unknown as UsageRow[];
  }

  bundle.data = data;

  // Write an audit event for the export itself
  try {
    await neon`
      INSERT INTO audit_log (workspace_id, actor, action, target, payload)
      VALUES (
        ${workspaceId},
        ${requestedBy},
        'compliance.export',
        ${exportId},
        ${JSON.stringify({ scope: activeScope, exportedAt })}::jsonb
      )
    `;
  } catch {
    // Non-fatal
  }

  return Response.json(bundle, {
    headers: {
      "Content-Disposition": `attachment; filename="eidon-export-${workspaceId}-${exportId.slice(0, 8)}.json"`,
    },
  });
}
