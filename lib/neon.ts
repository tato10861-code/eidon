// Optional Neon (serverless Postgres) client. Returns null when DATABASE_URL is
// missing, so the app keeps working in demo mode without a database.
import { neon } from "@neondatabase/serverless";

let cached: ReturnType<typeof neon> | null | undefined;

export function getNeon() {
  if (cached !== undefined) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    cached = null;
    return null;
  }
  try {
    cached = neon(url);
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export function isNeonConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
