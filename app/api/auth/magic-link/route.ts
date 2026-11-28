import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { siteUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const client = await getSupabase();
  const form = await request.formData().catch(() => null);
  const email = form?.get("email")?.toString().trim() || "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (!client) {
    return NextResponse.json({
      configured: false,
      message:
        "Demo mode: no database configured. In production this sends a magic link to " +
        email +
        ". See supabase/schema.sql and .env.example.",
    });
  }

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/dashboard`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ configured: true, message: "Magic link sent. Check your inbox." });
}
