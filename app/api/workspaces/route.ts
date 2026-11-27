import { NextResponse } from "next/server";
import { getSupabase, isDatabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const client = await getSupabase();
  if (!client) {
    return NextResponse.json({
      configured: false,
      workspaces: [],
      note: "Database not configured. Running in demo mode. See supabase/schema.sql and .env.example.",
    });
  }

  const { data, error } = await client
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ configured: true, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ configured: true, workspaces: data ?? [] });
}

export async function POST(request: Request) {
  const client = await getSupabase();
  if (!client) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

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

  const { data, error } = await client
    .from("workspaces")
    .insert({ name, slug, plan: body.plan ?? "starter" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ workspace: data }, { status: 201 });
}
