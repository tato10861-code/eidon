/**
 * Health check and system status endpoint.
 *
 * GET /api/health           — basic liveness check (no auth)
 * GET /api/health?full=1    — deep health with DB, AI engine, and latency (admin-key required)
 *
 * Enterprise buyers and monitoring tools poll this for:
 *   - uptime dashboards
 *   - alert routing (PagerDuty, Datadog, etc.)
 *   - Kubernetes readiness/liveness probes
 *   - SLA reporting
 *
 * Returns HTTP 200 when healthy, 503 when degraded/down.
 */

import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const START_TIME = Date.now();

function requireAdminKey(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  return key === expected;
}

async function checkDatabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const neon = getNeon();
  if (!neon) {
    return { ok: false, latencyMs: 0, error: "DATABASE_URL not configured" };
  }

  const start = Date.now();
  try {
    await neon`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - start, error: String(err) };
  }
}

async function checkAiEngine(
  baseUrl: string,
): Promise<{ ok: boolean; latencyMs: number; model?: string }> {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": process.env.ADMIN_API_KEY ?? "",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "ping" }],
        maxTokens: 5,
        stream: false,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) return { ok: false, latencyMs };
    const data = (await res.json()) as { model?: string };
    return { ok: true, latencyMs, model: data.model };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const full = url.searchParams.get("full") === "1";
  const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);

  // Basic liveness: always fast, no auth
  if (!full) {
    return Response.json(
      {
        status: "ok",
        version: process.env.npm_package_version ?? "0.3.0",
        uptimeSeconds,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Health-Status": "ok",
        },
      },
    );
  }

  // Full deep check — requires admin key
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = `${url.protocol}//${url.host}`;
  const [db, ai] = await Promise.all([checkDatabase(), checkAiEngine(baseUrl)]);

  const allOk = db.ok; // AI engine check is advisory
  const status = allOk ? "ok" : "degraded";

  const payload = {
    status,
    version: process.env.npm_package_version ?? "0.3.0",
    environment: process.env.NODE_ENV ?? "production",
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: db.ok ? "ok" : "error", latencyMs: db.latencyMs, error: db.error },
      aiEngine: { status: ai.ok ? "ok" : "degraded", latencyMs: ai.latencyMs, model: ai.model },
    },
  };

  return Response.json(payload, {
    status: allOk ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
      "X-Health-Status": status,
    },
  });
}
