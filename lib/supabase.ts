// Optional Supabase client. Returns null when env vars are missing, so the
// app keeps working in demo mode without a database.
export type SupabaseClient = any;

let cached: SupabaseClient | null | undefined;

export async function getSupabase(): Promise<SupabaseClient | null> {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    cached = null;
    return null;
  }

  try {
    const mod = await import("@supabase/supabase-js");
    cached = mod.createClient(url, key, {
      auth: { persistSession: false },
    });
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export function isDatabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}
