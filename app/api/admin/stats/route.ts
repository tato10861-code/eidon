import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import { getUsageStats } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdminKey(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  return key === expected;
}

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = getUsageStats();
  const neon = getNeon();

  let dbStats: Record<string, unknown> = {};
  if (neon) {
    try {
      type CountRow = { count: string };
      const [workspaces, employees, conversations, messages] = await Promise.all([
        neon`SELECT count(*) FROM workspaces` as Promise<CountRow[]>,
        neon`SELECT count(*) FROM employees` as Promise<CountRow[]>,
        neon`SELECT count(*) FROM conversations` as Promise<CountRow[]>,
        neon`SELECT count(*) FROM messages` as Promise<CountRow[]>,
      ]);

      type PlanRow = { plan: string; count: string };
      const planDistribution =
        (await neon`SELECT plan, count(*) as count FROM workspaces GROUP BY plan`) as PlanRow[];

      dbStats = {
        workspaces: parseInt(workspaces[0]?.count ?? "0"),
        employees: parseInt(employees[0]?.count ?? "0"),
        conversations: parseInt(conversations[0]?.count ?? "0"),
        messages: parseInt(messages[0]?.count ?? "0"),
        planDistribution: Object.fromEntries(
          planDistribution.map((r) => [r.plan, parseInt(r.count)]),
        ),
      };
    } catch {
      // Non-fatal — return partial stats
    }
  }

  return Response.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    runtime: stats,
    database: dbStats,
    timestamp: new Date().toISOString(),
  });
}
