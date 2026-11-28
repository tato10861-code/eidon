import { version } from "@/package.json";

export const dynamic = "force-dynamic";

function detectProvider(): string {
  const e = process.env;
  if (e.ANTHROPIC_API_KEY) return "anthropic";
  if (e.OPENROUTER_API_KEY ?? e.OPENROUTERAI_API_KEY) return "openrouter";
  if (e.GEMINI_API_KEY ?? e.GMINI_API_KEY ?? e.GOOGLE_API_KEY) return "gemini";
  if (e.MISTRAL_API_KEY) return "mistral";
  if (e.COHERE_API_KEY) return "cohere";
  if (e.XAI_API_KEY) return "xai";
  if (e.AI71_API_KEY) return "ai71";
  if (e.OPENAI_API_KEY) return "openai";
  return "demo";
}

export function GET() {
  const provider = detectProvider();
  return Response.json({
    status: "ok",
    service: "eidon",
    version,
    runtime: "eidon-core",
    provider,
    db: process.env.DATABASE_URL
      ? "neon"
      : process.env.NEXT_PUBLIC_SUPABASE_URL
        ? "supabase"
        : "none",
    timestamp: new Date().toISOString(),
  });
}
