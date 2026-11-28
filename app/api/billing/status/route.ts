import { getNeon } from "@/lib/neon";
import { PLANS, type PlanId } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/billing/status?workspaceId=ws_xxx
 *
 * Returns the current subscription status for a workspace.
 * Intended for client-side hydration of the billing settings page.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) {
    return Response.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    // No DB — return starter plan as default so the UI still renders
    return Response.json({
      plan: "starter" satisfies PlanId,
      planName: PLANS.starter.name,
      status: "active",
      conversationsUsed: 0,
      conversationsLimit: PLANS.starter.conversations,
      billingPeriodEnd: null,
      seats: 1,
    });
  }

  try {
    const rows = await neon`
      SELECT
        subscription_status,
        billing_period_end,
        seats,
        stripe_subscription_id
      FROM workspaces
      WHERE id = ${workspaceId}
      LIMIT 1
    `;
    if (!rows.length) {
      return Response.json({ error: "Workspace not found" }, { status: 404 });
    }

    const ws = rows[0];
    // Derive plan from subscription_status; default starter
    const plan: PlanId =
      ws.subscription_status === "active" || ws.subscription_status === "trialing"
        ? "scale"
        : "starter";

    // Count conversations this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const usageRows = await neon`
      SELECT COUNT(*)::int AS n
      FROM conversations
      WHERE workspace_id = ${workspaceId}
        AND created_at >= ${monthStart}
    `;

    return Response.json({
      plan,
      planName: PLANS[plan].name,
      status: ws.subscription_status ?? "none",
      conversationsUsed: usageRows[0]?.n ?? 0,
      conversationsLimit: PLANS[plan].conversations,
      billingPeriodEnd: ws.billing_period_end ?? null,
      seats: ws.seats ?? 1,
    });
  } catch {
    return Response.json({ error: "Database error" }, { status: 503 });
  }
}
