import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getNeon } from "@/lib/neon";
import { accessError, authenticateRequest } from "@/lib/auth/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let principal;
  try {
    principal = await authenticateRequest(request);
  } catch (error) {
    return accessError(error);
  }
  const supabase = await getSupabase();
  if (supabase) {
    const membershipQuery = supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("user_id", principal.kind === "session" ? principal.subject : "");
    const { data: memberships, error: membershipError } =
      principal.kind === "session"
        ? await membershipQuery
        : { data: [{ workspace_id: principal.workspaceId }], error: null };
    if (membershipError)
      return NextResponse.json(
        { configured: true, provider: "supabase", error: membershipError.message },
        { status: 500 },
      );
    const workspaceIds = (memberships ?? []).map(
      (row: { workspace_id: string }) => row.workspace_id,
    );
    if (!workspaceIds.length)
      return NextResponse.json({ configured: true, provider: "supabase", workspaces: [] });
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .in("id", workspaceIds)
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
      const workspaceIds =
        principal.kind === "session"
          ? await sql`select workspace_id from workspace_memberships where user_id = ${principal.subject}`
          : [{ workspace_id: principal.workspaceId }];
      const ids = (workspaceIds as { workspace_id: string }[]).map((row) => row.workspace_id);
      if (!ids.length)
        return NextResponse.json({ configured: true, provider: "neon", workspaces: [] });
      const rows =
        await sql`select * from workspaces where id = any(${ids}::uuid[]) order by created_at desc`;
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

export async function POST(request: NextRequest) {
  let principal;
  try {
    principal = await authenticateRequest(request);
  } catch (error) {
    return accessError(error);
  }
  if (principal.kind !== "session") {
    return NextResponse.json(
      { error: "A verified user session is required to create a workspace." },
      { status: 403 },
    );
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

  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("workspaces")
      .insert({ name, slug, plan: "starter" })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (principal.kind === "session" && data?.id) {
      await supabase.from("workspace_memberships").insert({
        workspace_id: data.id,
        user_id: principal.subject,
        role: "owner",
      });
    }
    return NextResponse.json({ provider: "supabase", workspace: data }, { status: 201 });
  }

  const sql = getNeon();
  if (sql) {
    try {
      const rows = await sql`
        insert into workspaces (name, slug, plan)
        values (${name}, ${slug}, 'starter')
        returning *
      `;
      if (principal.kind === "session" && (rows as { id?: string }[])[0]?.id) {
        await sql`
          insert into workspace_memberships (workspace_id, user_id, role)
          values (${(rows as { id: string }[])[0].id}, ${principal.subject}, 'owner')
        `;
      }
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
