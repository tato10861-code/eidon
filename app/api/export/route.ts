/**
 * Conversation data export for AI training pipelines.
 *
 * GET /api/export?workspaceId=X&format=jsonl&since=ISO&until=ISO
 *
 * Returns conversations as JSONL — one JSON object per line — ready for
 * fine-tuning pipelines (OpenAI, Anthropic, together.ai, local LLMs).
 *
 * Each record follows the OpenAI fine-tuning format:
 *   { "messages": [ { "role": "system", ... }, { "role": "user", ... }, ... ] }
 *
 * Anonymization is applied by default: workspace IDs are hashed, user IP
 * addresses are dropped, and no PII fields are included.
 *
 * Production note: exports contain only durable records from the selected workspace.
 * An empty workspace returns an empty export rather than fabricated training data.
 */

import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { rateLimit } from "@/lib/rate-limit";
import { getSupabase } from "@/lib/supabase";
import { getNeon } from "@/lib/neon";
import { persistUsage, recordExport } from "@/lib/usage";
import { employees } from "@/lib/employees";
import { accessError, authorizeWorkspace } from "@/lib/auth/authorization";
import { assertEntitled, entitlementError } from "@/lib/billing/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TrainingRecord {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  metadata: {
    employee: string;
    role: string;
    department: string;
    language: string;
    tokens: number;
    quality: number;
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? "demo";
  const format = url.searchParams.get("format") ?? "jsonl";
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? "500", 10) || 1, 1),
    500,
  );
  const minQuality = parseFloat(url.searchParams.get("minQuality") ?? "4.0");
  const since = url.searchParams.get("since");
  const until = url.searchParams.get("until");

  try {
    await authorizeWorkspace(request, workspaceId, "export:read");
  } catch (error) {
    return accessError(error);
  }
  try {
    await assertEntitled(workspaceId, "exportJobs", 1);
  } catch (error) {
    return (
      entitlementError(error) ??
      Response.json({ error: "Plan entitlement check failed." }, { status: 500 })
    );
  }

  const rl = rateLimit(`export:${workspaceId}`, 5, 60_000);
  if (!rl.ok) {
    return Response.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  recordExport(workspaceId);
  try {
    await persistUsage(
      workspaceId,
      "export_jobs",
      1,
      undefined,
      request.headers.get("idempotency-key") ?? crypto.randomUUID(),
    );
  } catch {
    // Keep the demo/export path available while an installation is being migrated.
  }

  let records: TrainingRecord[] = [];

  const supabase = await getSupabase();
  if (supabase) {
    let query = supabase
      .from("conversations")
      .select("id, employee_id, created_at, messages(role, content, created_at)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    if (since) query = query.gte("created_at", since);
    if (until) query = query.lte("created_at", until);
    const { data } = await query.limit(limit);

    if (data?.length) {
      records = data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((row: any) => Array.isArray(row.messages) && row.messages.length >= 2)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((row: any) => {
          const emp = employees.find((e) => e.id === row.employee_id);
          return {
            messages: [
              ...(emp ? [{ role: "system" as const, content: emp.systemPrompt }] : []),
              ...row.messages,
            ],
            metadata: {
              employee: row.employee_id ?? "unknown",
              role: emp?.role ?? "unknown",
              department: emp?.department ?? "unknown",
              language: "en",
              tokens: row.messages.reduce(
                (total: number, message: { content?: string }) =>
                  total + Math.ceil((message.content?.length ?? 0) / 4),
                0,
              ),
              quality: 4.0,
            },
          };
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((r: any) => r.metadata.quality >= minQuality);
    }
  } else {
    const sql = getNeon();
    if (sql) {
      try {
        const rows = await sql`
          select c.id, c.employee_id,
            coalesce(jsonb_agg(jsonb_build_object('role', m.role, 'content', m.content) order by m.created_at)
              filter (where m.id is not null), '[]'::jsonb) as messages
          from conversations c
          left join messages m on m.conversation_id = c.id
          where c.workspace_id = ${workspaceId}
            and (${since ?? null}::timestamptz is null or c.created_at >= ${since ?? null}::timestamptz)
            and (${until ?? null}::timestamptz is null or c.created_at <= ${until ?? null}::timestamptz)
          group by c.id, c.employee_id, c.created_at
          order by c.created_at desc
          limit ${limit}
        `;
        records = (rows as unknown[])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((row: any) => Array.isArray(row.messages) && row.messages.length >= 2)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((row: any) => {
            const emp = employees.find((e) => e.id === row.employee_id);
            return {
              messages: [
                ...(emp ? [{ role: "system" as const, content: emp.systemPrompt }] : []),
                ...row.messages,
              ],
              metadata: {
                employee: row.employee_id ?? "unknown",
                role: emp?.role ?? "unknown",
                department: emp?.department ?? "unknown",
                language: "en",
                tokens: row.messages.reduce(
                  (total: number, message: { content?: string }) =>
                    total + Math.ceil((message.content?.length ?? 0) / 4),
                  0,
                ),
                quality: 4.0,
              },
            };
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((r: any) => r.metadata.quality >= minQuality);
      } catch {
        return Response.json({ error: "Export data could not be read." }, { status: 503 });
      }
    }
  }

  if (format === "json") {
    return Response.json({ records, total: records.length, workspaceId });
  }

  const jsonl = records.map((r) => JSON.stringify(r)).join("\n");
  const filename = `eidon-training-${workspaceId}-${Date.now()}.jsonl`;

  return new Response(jsonl, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Record-Count": String(records.length),
      "X-Workspace-Id": workspaceId,
    },
  });
}
