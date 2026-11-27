import { version } from "@/package.json";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    status: "ok",
    service: "eidon",
    version,
    runtime: "eidon-core",
    provider: process.env.OPENAI_API_KEY ? "configured" : "demo",
    timestamp: new Date().toISOString(),
  });
}
