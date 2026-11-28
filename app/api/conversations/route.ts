import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getNeon } from "@/lib/neon";
import { accessError, authorizeWorkspace } from "@/lib/auth/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId")?.trim();
  if (!workspaceId)
    return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
  try {
    await authorizeWorkspace(request, workspaceId, "conversations:read");
  } catch (error) {
    return accessError(error);
  }

  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ configured: true, provider: "supabase", conversations: data ?? [] });
  }

  const sql = getNeon();
  if (sql) {
    try {
      const rows =
        await sql`select * from conversations where workspace_id = ${workspaceId} order by created_at desc limit 50`;
      return NextResponse.json({ configured: true, provider: "neon", conversations: rows });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }
  return NextResponse.json({ configured: false, conversations: [] });
}

export async function POST(request: NextRequest) {
  let body: { workspaceId?: string; title?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId)
    return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
  try {
    await authorizeWorkspace(request, workspaceId, "conversations:write");
  } catch (error) {
    return accessError(error);
  }

  const title = body.title?.trim().slice(0, 200) || "New conversation";
  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("conversations")
      .insert({ workspace_id: workspaceId, title })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ provider: "supabase", conversation: data }, { status: 201 });
  }

  const sql = getNeon();
  if (sql) {
    try {
      const rows =
        await sql`insert into conversations (workspace_id, title) values (${workspaceId}, ${title}) returning *`;
      return NextResponse.json(
        { provider: "neon", conversation: (rows as { id: string }[])[0] },
        { status: 201 },
      );
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }
  return NextResponse.json({ configured: false, note: "Demo mode: not persisted." });
}
