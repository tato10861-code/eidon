import { getNeon } from "@/lib/neon";
import { getSupabase } from "@/lib/supabase";
import { getDurableMetric, getUsage, reserveUsage } from "@/lib/usage";
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
      .select("plan, billing_subscriptions(status, plan)")
      .eq("id", workspaceId)
      .maybeSingle();
    const subscription = Array.isArray(data?.billing_subscriptions)
      ? data.billing_subscriptions[0]
      : data?.billing_subscriptions;
    return resolveEffectivePlan(data?.plan, subscription?.status, subscription?.plan);
  }
  const sql = getNeon();
  if (sql) {
    const rows = await sql`
      select w.plan, s.status as subscription_status, s.plan as subscription_plan
      from workspaces w left join billing_subscriptions s on s.workspace_id = w.id
      where w.id = ${workspaceId} limit 1
    `;
    const row = (
      rows as { plan?: string; subscription_status?: string; subscription_plan?: string }[]
    )[0];
    return resolveEffectivePlan(row?.plan, row?.subscription_status, row?.subscription_plan);
  }
  return "starter";
}

function resolveEffectivePlan(
  workspacePlan: unknown,
  subscriptionStatus: unknown,
  subscriptionPlan: unknown,
): PlanId {
  const candidate = normalizePlan(subscriptionPlan ?? workspacePlan);
  if (candidate === "starter") return "starter";
  return subscriptionStatus === "active" || subscriptionStatus === "trialing"
    ? candidate
    : "starter";
}

export async function assertEntitled(
  workspaceId: string,
  metric: BillableMetric,
  increment = 1,
  eventId?: string,
  employeeId?: string,
) {
  if (!Number.isInteger(increment) || increment <= 0) {
    throw new RangeError("Entitlement increment must be a positive integer.");
  }
  const plan = await getPlan(workspaceId);
  const limit = PLAN_LIMITS[plan][metric];
  if (limit === null) return { plan, current: 0, limit: null };
  if (eventId && (metric === "conversationTurns" || metric === "exportJobs")) {
    const reserved = await reserveUsage(
      workspaceId,
      metric === "conversationTurns" ? "conversation_turns" : "export_jobs",
      increment,
      eventId,
      employeeId,
    );
    const durableMetric = durableMetricFor(metric);
    const current = (await getDurableMetric(workspaceId, durableMetric)) ?? increment;
    if (!reserved) throw new EntitlementDenied(workspaceId, metric, limit, current);
    return { plan, current, limit };
  }
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

function durableMetricFor(metric: BillableMetric) {
  return metric === "conversationTurns"
    ? "conversationTurns"
    : metric === "chatTokens"
      ? "chatTokens"
      : metric === "exportJobs"
        ? "exportJobs"
        : "apiCalls";
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
