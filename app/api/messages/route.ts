import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import { getSupabase } from "@/lib/supabase";
import { accessError, authorizeWorkspace } from "@/lib/auth/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const conversationId = request.nextUrl.searchParams.get("conversationId")?.trim();
  const workspaceId = request.nextUrl.searchParams.get("workspaceId")?.trim();
  const limit = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("limit") ?? "50") || 1, 1),
    200,
  );
  if (!conversationId || !workspaceId) {
    return Response.json(
      { error: "conversationId and workspaceId are required." },
      { status: 400 },
    );
  }
  try {
    await authorizeWorkspace(request, workspaceId, "conversations:read");
  } catch (error) {
    return accessError(error);
  }

  const supabase = await getSupabase();
  if (supabase) {
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (!conversation) return Response.json({ error: "Conversation not found." }, { status: 404 });
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ provider: "supabase", messages: data ?? [] });
  }

  const sql = getNeon();
  if (sql) {
    try {
      const conversation =
        await sql`select id from conversations where id = ${conversationId} and workspace_id = ${workspaceId} limit 1`;
      if (!(conversation as { id: string }[]).length)
        return Response.json({ error: "Conversation not found." }, { status: 404 });
      const rows =
        await sql`select * from messages where conversation_id = ${conversationId} order by created_at asc limit ${limit}`;
      return Response.json({ provider: "neon", messages: rows });
    } catch (error) {
      return Response.json({ error: String(error) }, { status: 500 });
    }
  }
  return Response.json({ configured: false, messages: [] });
}

export async function POST(request: NextRequest) {
  let body: { workspaceId?: string; conversationId?: string; role?: string; content?: string } = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const workspaceId = body.workspaceId?.trim();
  const content = body.content?.trim();
  if (!workspaceId || !body.conversationId || !body.role || !content) {
    return Response.json(
      { error: "workspaceId, conversationId, role and content are required." },
      { status: 400 },
    );
  }
  if (!["user", "assistant", "system"].includes(body.role)) {
    return Response.json({ error: "role must be user, assistant or system." }, { status: 400 });
  }
  try {
    await authorizeWorkspace(request, workspaceId, "conversations:write");
  } catch (error) {
    return accessError(error);
  }

  const supabase = await getSupabase();
  if (supabase) {
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", body.conversationId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (!conversation) return Response.json({ error: "Conversation not found." }, { status: 404 });
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: body.conversationId, role: body.role, content })
      .select()
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ provider: "supabase", message: data }, { status: 201 });
  }

  const sql = getNeon();
  if (sql) {
    try {
      const conversation =
        await sql`select id from conversations where id = ${body.conversationId} and workspace_id = ${workspaceId} limit 1`;
      if (!(conversation as { id: string }[]).length)
        return Response.json({ error: "Conversation not found." }, { status: 404 });
      const rows =
        await sql`insert into messages (conversation_id, role, content) values (${body.conversationId}, ${body.role}, ${content}) returning *`;
      return Response.json(
        { provider: "neon", message: (rows as { id: string }[])[0] },
        { status: 201 },
      );
    } catch (error) {
      return Response.json({ error: String(error) }, { status: 500 });
    }
  }
  return Response.json({ configured: false, note: "Demo mode: not persisted." });
}
