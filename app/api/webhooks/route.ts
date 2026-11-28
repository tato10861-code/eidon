import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getNeon } from "@/lib/neon";
import crypto from "node:crypto";

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
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");

  const neon = getNeon();
  if (!neon) {
    return Response.json({ webhooks: [] });
  }

  const rows = workspaceId
    ? await neon`SELECT id, url, events, active, created_at FROM webhooks WHERE workspace_id = ${workspaceId} ORDER BY created_at DESC`
    : await neon`SELECT id, url, events, active, created_at FROM webhooks ORDER BY created_at DESC LIMIT 100`;

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

  if (!url || typeof url !== "string") {
    return Response.json({ error: "url is required." }, { status: 400 });
  }

  try {
    new URL(url);
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
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");

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
