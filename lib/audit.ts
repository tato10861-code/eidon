import crypto from "node:crypto";
import { getNeon } from "@/lib/neon";
import { getSupabase } from "@/lib/supabase";

const SENSITIVE = /token|secret|password|authorization|api[-_]?key/i;

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE.test(key) ? "[REDACTED]" : redact(entry),
    ]),
  );
}

export async function writeAudit(input: {
  workspaceId: string;
  actor: string;
  actorType?: "session" | "api_key" | "system";
  requestId?: string;
  action: string;
  target?: string;
  outcome?: "requested" | "approved" | "rejected" | "executed" | "failed";
  payload?: unknown;
}) {
  const payload = redact({
    outcome: input.outcome ?? "requested",
    ...(input.payload as Record<string, unknown> | undefined),
  });
  try {
    const supabase = await getSupabase();
    if (supabase) {
      await supabase.from("audit_log").insert({
        workspace_id: input.workspaceId,
        actor: input.actor,
        action: input.action,
        target: input.target ?? null,
        payload,
        schema_version: 1,
        request_id: input.requestId ?? crypto.randomUUID(),
        actor_type: input.actorType ?? "system",
      });
      return;
    }
    const sql = getNeon();
    if (sql) {
      await sql`
        insert into audit_log (workspace_id, actor, actor_type, action, target, payload, schema_version, request_id)
        values (${input.workspaceId}, ${input.actor}, ${input.actorType ?? "system"}, ${input.action}, ${input.target ?? null}, ${JSON.stringify(payload)}::jsonb, 1, ${input.requestId ?? crypto.randomUUID()})
      `;
    }
  } catch {
    // Audit must never turn a customer request into a 500; operational alerts cover DB failures.
  }
}
