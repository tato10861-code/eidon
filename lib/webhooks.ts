import crypto from "node:crypto";
import { getNeon } from "./neon";

export type WebhookEventType =
  "conversation.created" | "message.created" | "chat.completed" | "key.created" | "key.revoked";

export interface WebhookPayload<T = unknown> {
  id: string;
  event: WebhookEventType;
  createdAt: string;
  data: T;
}

function sign(secret: string, body: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

async function deliverOne(url: string, payload: WebhookPayload, secret: string): Promise<boolean> {
  const body = JSON.stringify(payload);
  const sig = sign(secret, body);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Eidon-Signature": sig,
        "X-Eidon-Event": payload.event,
        "User-Agent": "Eidon-Webhooks/1.0",
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function dispatchWebhook<T>(
  event: WebhookEventType,
  data: T,
  workspaceId?: string,
): Promise<void> {
  const neon = getNeon();
  if (!neon) return;

  type WebhookRow = { url: string; signing_secret: string };
  const rows = (
    workspaceId
      ? await neon`SELECT url, signing_secret FROM webhooks WHERE active = true AND events @> ${JSON.stringify([event])}::jsonb AND workspace_id = ${workspaceId}`
      : await neon`SELECT url, signing_secret FROM webhooks WHERE active = true AND events @> ${JSON.stringify([event])}::jsonb`
  ) as WebhookRow[];

  if (!rows || rows.length === 0) return;

  const payload: WebhookPayload<T> = {
    id: `evt_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`,
    event,
    createdAt: new Date().toISOString(),
    data,
  };

  await Promise.allSettled(
    rows.map((row: WebhookRow) => deliverOne(row.url, payload, row.signing_secret)),
  );
}

export function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = sign(secret, body);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
