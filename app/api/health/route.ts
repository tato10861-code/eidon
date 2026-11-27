export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    status: "ok",
    service: "eidon",
    version: "0.1.0",
    runtime: "eidon-core",
    provider: process.env.OPENAI_API_KEY ? "configured" : "demo",
    timestamp: new Date().toISOString(),
  });
}
