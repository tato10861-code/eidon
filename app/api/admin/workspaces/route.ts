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

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  type Row = {
    id: string;
    name: string;
    slug: string;
    plan: string;
    region: string;
    created_at: string;
  };
  type CountRow = { count: string };

  const [rows, totalRows] = await Promise.all([
    neon`
      SELECT id, name, slug, plan, region, created_at
      FROM workspaces
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    ` as Promise<Row[]>,
    neon`SELECT count(*) FROM workspaces` as Promise<CountRow[]>,
  ]);

  const total = parseInt(totalRows[0]?.count ?? "0");

  return Response.json({
    workspaces: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
