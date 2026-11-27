/**
 * Message history endpoint.
 * GET /api/messages?conversationId=X&limit=50
 * POST /api/messages — append a message manually
 */

import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);

  if (!conversationId) {
    return Response.json({ error: "conversationId is required." }, { status: 400 });
  }

  const supabase = await getSupabase();
  if (supabase) {
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
      const rows = await sql`
        select * from messages
        where conversation_id = ${conversationId}
        order by created_at asc
        limit ${limit}
      `;
      return Response.json({ provider: "neon", messages: rows });
    } catch (error) {
      return Response.json({ error: String(error) }, { status: 500 });
    }
  }

  return Response.json({ configured: false, messages: [] });
}

export async function POST(request: NextRequest) {
  let body: { conversationId?: string; role?: string; content?: string } = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body.conversationId || !body.role || !body.content) {
    return Response.json(
      { error: "conversationId, role and content are required." },
      { status: 400 },
    );
  }
  if (!["user", "assistant", "system"].includes(body.role)) {
    return Response.json({ error: "role must be user, assistant or system." }, { status: 400 });
  }

  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: body.conversationId, role: body.role, content: body.content })
      .select()
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ provider: "supabase", message: data }, { status: 201 });
  }

  const sql = getNeon();
  if (sql) {
    try {
      const rows = await sql`
        insert into messages (conversation_id, role, content)
        values (${body.conversationId}, ${body.role}, ${body.content})
        returning *
      `;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Response.json({ provider: "neon", message: (rows as any)[0] }, { status: 201 });
    } catch (error) {
      return Response.json({ error: String(error) }, { status: 500 });
    }
  }

  return Response.json({ configured: false, note: "Demo mode: not persisted." });
}
