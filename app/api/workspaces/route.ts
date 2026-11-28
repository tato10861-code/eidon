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
    const { data, error } = await supabase.rpc("create_workspace_with_owner", {
      p_name: name,
      p_slug: slug,
      p_user_id: principal.subject,
    });
    if (error) {
      const status = error.code === "23505" ? 409 : 500;
      return NextResponse.json(
        {
          error:
            status === 409 ? "Workspace slug is already in use." : "Workspace creation failed.",
        },
        { status },
      );
    }
    return NextResponse.json({ provider: "supabase", workspace: data }, { status: 201 });
  }

  const sql = getNeon();
  if (sql) {
    try {
      const rows = await sql`
        select * from create_workspace_with_owner(${name}, ${slug}, ${principal.subject}::uuid)
      `;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return NextResponse.json({ provider: "neon", workspace: (rows as any)[0] }, { status: 201 });
    } catch (error) {
      const message = String(error);
      return NextResponse.json(
        {
          error: message.includes("duplicate key")
            ? "Workspace slug is already in use."
            : "Workspace creation failed.",
        },
        { status: message.includes("duplicate key") ? 409 : 500 },
      );
    }
  }

  return NextResponse.json(
    { configured: false, note: "Demo mode: not persisted." },
    { status: 503 },
  );
}
