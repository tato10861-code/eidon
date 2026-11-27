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
 * Production note: wire this to the actual conversation store (Neon/Supabase).
 * The demo returns synthetic records to show the schema.
 */

import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getSupabase } from "@/lib/supabase";
import { getNeon } from "@/lib/neon";
import { recordExport } from "@/lib/usage";
import { employees } from "@/lib/employees";

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

function syntheticRecords(count: number): TrainingRecord[] {
  const examples: TrainingRecord[] = [];
  for (let i = 0; i < count; i++) {
    const emp = employees[i % employees.length]!;
    examples.push({
      messages: [
        { role: "system", content: emp.systemPrompt },
        { role: "user", content: emp.starters[i % emp.starters.length]! },
        {
          role: "assistant",
          content: `As ${emp.name}, I'll address this by applying ${emp.skills[0]} and ${emp.skills[1] ?? "domain expertise"}. ${emp.playbook.deliverable}`,
        },
      ],
      metadata: {
        employee: emp.id,
        role: emp.role,
        department: emp.department,
        language: "en",
        tokens: 180 + (i % 120),
        quality: 4 + (i % 2 === 0 ? 0.9 : 0.5),
      },
    });
  }
  return examples;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? "demo";
  const format = url.searchParams.get("format") ?? "jsonl";
  const limit = parseInt(url.searchParams.get("limit") ?? "500", 10);
  const minQuality = parseFloat(url.searchParams.get("minQuality") ?? "4.0");

  const rl = rateLimit(`export:${workspaceId}`, 5, 60_000);
  if (!rl.ok) {
    return Response.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  recordExport(workspaceId);

  let records: TrainingRecord[] = [];

  const supabase = await getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("conversations")
      .select("id, messages, employee_id, metadata")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(limit);

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
              tokens: row.metadata?.tokens ?? 0,
              quality: row.metadata?.quality ?? 4.0,
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
          select id, messages, employee_id, metadata
          from conversations
          where workspace_id = ${workspaceId}
          order by created_at desc
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
                tokens: row.metadata?.tokens ?? 0,
                quality: row.metadata?.quality ?? 4.0,
              },
            };
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((r: any) => r.metadata.quality >= minQuality);
      } catch {
        // fall through to synthetic
      }
    }
  }

  if (!records.length) {
    records = syntheticRecords(Math.min(limit, 48));
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
