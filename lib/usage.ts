/**
 * Usage accounting with an in-memory demo fallback and durable database writes.
 *
 * Tracks: API calls, chat tokens, conversation turns and export jobs per
 * workspace so the billing dashboard and rate-limiter can read live numbers.
 */

export interface UsageRecord {
  workspaceId: string;
  periodStart: number;
  apiCalls: number;
  chatTokens: number;
  conversationTurns: number;
  exportJobs: number;
  employeeRuns: Record<string, number>;
}

const store = new Map<string, UsageRecord>();

function key(workspaceId: string, month: string) {
  return `${workspaceId}:${month}`;
}

export function currentMonth() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getOrCreate(workspaceId: string): UsageRecord {
  const k = key(workspaceId, currentMonth());
  if (!store.has(k)) {
    store.set(k, {
      workspaceId,
      periodStart: Date.now(),
      apiCalls: 0,
      chatTokens: 0,
      conversationTurns: 0,
      exportJobs: 0,
      employeeRuns: {},
    });
  }
  return store.get(k)!;
}

export function recordApiCall(workspaceId: string) {
  getOrCreate(workspaceId).apiCalls++;
}

export function recordChat(workspaceId: string, tokens: number, employeeId: string) {
  const rec = getOrCreate(workspaceId);
  rec.chatTokens += tokens;
  rec.conversationTurns++;
  rec.employeeRuns[employeeId] = (rec.employeeRuns[employeeId] ?? 0) + 1;
}

export function recordExport(workspaceId: string) {
  getOrCreate(workspaceId).exportJobs++;
}

export function getUsage(workspaceId: string): UsageRecord {
  return getOrCreate(workspaceId);
}

export function getUsageSummary(workspaceId: string) {
  const rec = getUsage(workspaceId);
  const topEmployee = Object.entries(rec.employeeRuns).sort(([, a], [, b]) => b - a)[0];
  return {
    ...rec,
    topEmployee: topEmployee ? { id: topEmployee[0], runs: topEmployee[1] } : null,
    month: currentMonth(),
  };
}

export async function getDurableMetric(
  workspaceId: string,
  metric: keyof Pick<UsageRecord, "apiCalls" | "chatTokens" | "conversationTurns" | "exportJobs">,
) {
  const column =
    metric === "apiCalls"
      ? "api_calls"
      : metric === "chatTokens"
        ? "chat_tokens"
        : metric === "conversationTurns"
          ? "conversation_turns"
          : "export_jobs";
  const { getSupabase } = await import("@/lib/supabase");
  const supabase = await getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("usage_monthly")
      .select(column)
      .eq("workspace_id", workspaceId)
      .eq("period", currentMonth())
      .maybeSingle();
    return typeof data?.[column] === "number" ? Number(data[column]) : null;
  }
  const { getNeon } = await import("@/lib/neon");
  const sql = getNeon();
  if (!sql) return null;
  const rows =
    metric === "apiCalls"
      ? await sql`select api_calls as value from usage_monthly where workspace_id = ${workspaceId} and period = ${currentMonth()} limit 1`
      : metric === "chatTokens"
        ? await sql`select chat_tokens as value from usage_monthly where workspace_id = ${workspaceId} and period = ${currentMonth()} limit 1`
        : metric === "conversationTurns"
          ? await sql`select conversation_turns as value from usage_monthly where workspace_id = ${workspaceId} and period = ${currentMonth()} limit 1`
          : await sql`select export_jobs as value from usage_monthly where workspace_id = ${workspaceId} and period = ${currentMonth()} limit 1`;
  const value = (rows as { value?: number }[])[0]?.value;
  return typeof value === "number" ? Number(value) : null;
}

export async function persistUsage(
  workspaceId: string,
  metric: "api_calls" | "chat_tokens" | "conversation_turns" | "export_jobs",
  amount: number,
  employeeId?: string,
  eventId?: string,
) {
  const { getSupabase } = await import("@/lib/supabase");
  const supabase = await getSupabase();
  if (supabase) {
    if (eventId) {
      const { error } = await supabase.from("usage_events").insert({
        id: eventId,
        workspace_id: workspaceId,
        metric,
        amount,
      });
      if (error?.code === "23505") return;
      if (error) throw error;
    }
    const { data } = await supabase
      .from("usage_monthly")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("period", currentMonth())
      .maybeSingle();
    const next = {
      ...(data ?? {}),
      workspace_id: workspaceId,
      period: currentMonth(),
      [metric]: Number(data?.[metric] ?? 0) + amount,
      updated_at: new Date().toISOString(),
    };
    if (employeeId)
      next.employee_runs = {
        ...(data?.employee_runs ?? {}),
        [employeeId]: Number(data?.employee_runs?.[employeeId] ?? 0) + 1,
      };
    await supabase.from("usage_monthly").upsert(next, { onConflict: "workspace_id,period" });
    return;
  }
  const { getNeon } = await import("@/lib/neon");
  const sql = getNeon();
  if (!sql) return;
  if (eventId) {
    try {
      await sql`insert into usage_events (id, workspace_id, metric, amount) values (${eventId}, ${workspaceId}, ${metric}, ${amount})`;
    } catch (error) {
      if (String(error).includes("duplicate key")) return;
      throw error;
    }
  }
  const employeeRuns = employeeId ? JSON.stringify({ [employeeId]: 1 }) : "{}";
  if (metric === "api_calls") {
    await sql`insert into usage_monthly (workspace_id, period, api_calls, employee_runs) values (${workspaceId}, ${currentMonth()}, ${amount}, ${employeeRuns}::jsonb) on conflict (workspace_id, period) do update set api_calls = usage_monthly.api_calls + ${amount}, updated_at = now()`;
  } else if (metric === "chat_tokens") {
    await sql`insert into usage_monthly (workspace_id, period, chat_tokens, employee_runs) values (${workspaceId}, ${currentMonth()}, ${amount}, ${employeeRuns}::jsonb) on conflict (workspace_id, period) do update set chat_tokens = usage_monthly.chat_tokens + ${amount}, updated_at = now()`;
  } else if (metric === "conversation_turns") {
    await sql`insert into usage_monthly (workspace_id, period, conversation_turns, employee_runs) values (${workspaceId}, ${currentMonth()}, ${amount}, ${employeeRuns}::jsonb) on conflict (workspace_id, period) do update set conversation_turns = usage_monthly.conversation_turns + ${amount}, updated_at = now()`;
  } else {
    await sql`insert into usage_monthly (workspace_id, period, export_jobs, employee_runs) values (${workspaceId}, ${currentMonth()}, ${amount}, ${employeeRuns}::jsonb) on conflict (workspace_id, period) do update set export_jobs = usage_monthly.export_jobs + ${amount}, updated_at = now()`;
  }
}
