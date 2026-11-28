import { getNeon } from "@/lib/neon";
import { getSupabase } from "@/lib/supabase";
import { getDurableMetric, getUsage } from "@/lib/usage";
import { normalizePlan, PLAN_LIMITS, type BillableMetric, type PlanId } from "@/lib/billing/plans";

export class EntitlementDenied extends Error {
  readonly status = 402;
  readonly code = "PLAN_LIMIT_REACHED";
  constructor(
    readonly workspaceId: string,
    readonly metric: BillableMetric,
    readonly limit: number,
    readonly current: number,
  ) {
    super(`The ${metric} limit for this workspace plan has been reached.`);
  }
}

async function getPlan(workspaceId: string): Promise<PlanId> {
  const supabase = await getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("workspaces")
      .select("plan")
      .eq("id", workspaceId)
      .maybeSingle();
    return normalizePlan(data?.plan);
  }
  const sql = getNeon();
  if (sql) {
    const rows = await sql`select plan from workspaces where id = ${workspaceId} limit 1`;
    return normalizePlan((rows as { plan?: string }[])[0]?.plan);
  }
  return "starter";
}

export async function assertEntitled(workspaceId: string, metric: BillableMetric, increment = 1) {
  const plan = await getPlan(workspaceId);
  const limit = PLAN_LIMITS[plan][metric];
  if (limit === null) return { plan, current: 0, limit: null };
  const durableMetric =
    metric === "conversationTurns"
      ? "conversationTurns"
      : metric === "chatTokens"
        ? "chatTokens"
        : metric === "exportJobs"
          ? "exportJobs"
          : "apiCalls";
  const current =
    (await getDurableMetric(workspaceId, durableMetric)) ?? getUsage(workspaceId)[metric];
  if (current + increment > limit) throw new EntitlementDenied(workspaceId, metric, limit, current);
  return { plan, current, limit };
}

export function entitlementError(error: unknown) {
  if (error instanceof EntitlementDenied) {
    return Response.json(
      {
        error: error.message,
        code: error.code,
        metric: error.metric,
        current: error.current,
        limit: error.limit,
      },
      { status: error.status, headers: { "X-Eidon-Plan-Limit": String(error.limit) } },
    );
  }
  return null;
}
