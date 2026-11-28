import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getNeon } from "@/lib/neon";
import crypto from "node:crypto";
import { accessError, authorizeWorkspace } from "@/lib/auth/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type WebhookEvent =
  "conversation.created" | "message.created" | "chat.completed" | "key.created" | "key.revoked";

const VALID_EVENTS: WebhookEvent[] = [
  "conversation.created",
  "message.created",
  "chat.completed",
  "key.created",
  "key.revoked",
];

interface WebhookBody {
  url: string;
  events: WebhookEvent[];
  secret?: string;
}

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId")?.trim();
  if (!workspaceId) return Response.json({ error: "workspaceId is required." }, { status: 400 });
  try {
    await authorizeWorkspace(request, workspaceId, "admin");
  } catch (error) {
    return accessError(error);
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ webhooks: [] });
  }

  const rows =
    await neon`SELECT id, url, events, active, created_at FROM webhooks WHERE workspace_id = ${workspaceId} ORDER BY created_at DESC`;

  return Response.json({ webhooks: rows });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limit = rateLimit(`webhooks:create:${ip}`, 20, 60_000);
  if (!limit.ok) {
    return Response.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  let body: WebhookBody;
  try {
    body = (await request.json()) as WebhookBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { url, events, secret } = body;
  const workspaceId = request.nextUrl.searchParams.get("workspaceId")?.trim();
  if (!workspaceId) return Response.json({ error: "workspaceId is required." }, { status: 400 });
  try {
    await authorizeWorkspace(request, workspaceId, "admin");
  } catch (error) {
    return accessError(error);
  }

  if (!url || typeof url !== "string") {
    return Response.json({ error: "url is required." }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const blocked =
      parsed.protocol !== "https:" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname === "169.254.169.254" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
    if (blocked) throw new Error("private or non-HTTPS target");
  } catch {
    return Response.json({ error: "url must be a valid HTTPS URL." }, { status: 400 });
  }

  if (!events || !Array.isArray(events) || events.length === 0) {
    return Response.json({ error: "events array is required." }, { status: 400 });
  }

  const invalid = events.filter((e) => !VALID_EVENTS.includes(e));
  if (invalid.length > 0) {
    return Response.json(
      { error: `Unknown event types: ${invalid.join(", ")}. Valid: ${VALID_EVENTS.join(", ")}` },
      { status: 400 },
    );
  }

  const id = `wh_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const signingSecret = secret ?? `whsec_${crypto.randomBytes(24).toString("base64url")}`;
  const neon = getNeon();
  if (neon) {
    await neon`
      INSERT INTO webhooks (id, workspace_id, url, events, signing_secret, active)
      VALUES (${id}, ${workspaceId}, ${url}, ${JSON.stringify(events)}, ${signingSecret}, true)
    `;
  }

  return Response.json(
    {
      id,
      url,
      events,
      active: true,
      signingSecret,
      createdAt: new Date().toISOString(),
    },
    { status: 201 },
  );
}
