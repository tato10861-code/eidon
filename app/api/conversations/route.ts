import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getNeon } from "@/lib/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");

  const supabase = await getSupabase();
  if (supabase) {
    let query = supabase
      .from("conversations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (workspaceId) query = query.eq("workspace_id", workspaceId);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ configured: true, provider: "supabase", conversations: data ?? [] });
  }

  const sql = getNeon();
  if (sql) {
    try {
      const rows = workspaceId
        ? await sql`select * from conversations where workspace_id = ${workspaceId} order by created_at desc limit 50`
        : await sql`select * from conversations order by created_at desc limit 50`;
      return NextResponse.json({ configured: true, provider: "neon", conversations: rows });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  return NextResponse.json({ configured: false, conversations: [] });
}

export async function POST(request: Request) {
  let body: { workspaceId?: string; title?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("conversations")
      .insert({ workspace_id: body.workspaceId ?? null, title: body.title ?? "New conversation" })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ provider: "supabase", conversation: data }, { status: 201 });
  }

  const sql = getNeon();
  if (sql) {
    try {
      const rows = await sql`
        insert into conversations (workspace_id, title)
        values (${body.workspaceId ?? null}, ${body.title ?? "New conversation"})
        returning *
      `;
      return NextResponse.json(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { provider: "neon", conversation: (rows as any)[0] },
        { status: 201 },
      );
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  return NextResponse.json({ configured: false, note: "Demo mode: not persisted." });
}
