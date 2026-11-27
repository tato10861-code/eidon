import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getNeon } from "@/lib/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .order("created_at", { ascending: false });
    if (error)
      return NextResponse.json(
        { configured: true, provider: "supabase", error: error.message },
        { status: 500 },
      );
    return NextResponse.json({ configured: true, provider: "supabase", workspaces: data ?? [] });
  }

  const sql = getNeon();
  if (sql) {
    try {
      const rows = await sql`select * from workspaces order by created_at desc`;
      return NextResponse.json({ configured: true, provider: "neon", workspaces: rows });
    } catch (error) {
      return NextResponse.json(
        { configured: true, provider: "neon", error: String(error) },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    configured: false,
    workspaces: [],
    note: "Database not configured. Running in demo mode. Set Supabase env vars or DATABASE_URL (Neon). See .env.example.",
  });
}

export async function POST(request: Request) {
  let body: { name?: string; slug?: string; plan?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = body.name?.trim();
  const slug = body.slug?.trim() || name?.toLowerCase().replace(/\s+/g, "-");
  if (!name || !slug) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("workspaces")
      .insert({ name, slug, plan: body.plan ?? "starter" })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ provider: "supabase", workspace: data }, { status: 201 });
  }

  const sql = getNeon();
  if (sql) {
    try {
      const rows = await sql`
        insert into workspaces (name, slug, plan)
        values (${name}, ${slug}, ${body.plan ?? "starter"})
        returning *
      `;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return NextResponse.json({ provider: "neon", workspace: (rows as any)[0] }, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  return NextResponse.json(
    { configured: false, note: "Demo mode: not persisted." },
    { status: 503 },
  );
}
