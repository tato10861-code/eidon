import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const client = await getSupabase();
  if (!client) {
    return NextResponse.json({ configured: false, conversations: [] });
  }
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");

  let query = client
    .from("conversations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (workspaceId) query = query.eq("workspace_id", workspaceId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ configured: true, conversations: data ?? [] });
}

export async function POST(request: Request) {
  const client = await getSupabase();
  if (!client) {
    return NextResponse.json({ configured: false, note: "Demo mode: not persisted." });
  }

  let body: { workspaceId?: string; employeeId?: string; title?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { data, error } = await client
    .from("conversations")
    .insert({
      workspace_id: body.workspaceId ?? null,
      title: body.title ?? "New conversation",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversation: data }, { status: 201 });
}
