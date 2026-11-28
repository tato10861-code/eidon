import crypto from "node:crypto";
import { getNeon } from "./neon";

export type WebhookEventType =
  | "conversation.created"
  | "message.created"
  | "chat.completed"
  | "key.created"
  | "key.revoked"
  | "member.invited"
  | "member.removed"
  | "member.role_changed"
  | "employee.created"
  | "employee.updated"
  | "employee.deleted"
  | "billing.subscription_created"
  | "billing.subscription_updated"
  | "billing.subscription_cancelled"
  | "export.completed"
  | "sso.configured"
  | "security.session_revoked"
  | "security.allowlist_updated";

export interface WebhookPayload<T = unknown> {
  id: string;
  event: WebhookEventType;
  createdAt: string;
  data: T;
}

function sign(secret: string, body: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1_000, 5_000, 30_000];

interface DeliveryResult {
  success: boolean;
  statusCode: number | null;
  attempt: number;
  durationMs: number;
}

async function deliverWithRetry(
  webhookId: string,
  url: string,
  payload: WebhookPayload,
  secret: string,
): Promise<DeliveryResult> {
  const body = JSON.stringify(payload);
  const sig = sign(secret, body);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 1) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 2]));
    }
    const start = Date.now();
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Eidon-Signature": sig,
          "X-Eidon-Event": payload.event,
          "X-Eidon-Delivery": payload.id,
          "User-Agent": "Eidon-Webhooks/1.0",
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      const durationMs = Date.now() - start;
      if (res.ok) {
        return { success: true, statusCode: res.status, attempt, durationMs };
      }
      if (res.status < 500) {
        // 4xx — no point retrying
        return { success: false, statusCode: res.status, attempt, durationMs };
      }
    } catch {
      // Network error — retry
    }
  }
  return { success: false, statusCode: null, attempt: MAX_RETRIES, durationMs: 0 };
}

async function recordDelivery(
  webhookId: string,
  deliveryId: string,
  event: string,
  payload: WebhookPayload,
  result: DeliveryResult,
): Promise<void> {
  const neon = getNeon();
  if (!neon) return;
  try {
    await neon`
      INSERT INTO webhook_deliveries (id, webhook_id, event, payload, status_code, success, attempt)
      VALUES (${deliveryId}, ${webhookId}, ${event}, ${JSON.stringify(payload)}::jsonb,
              ${result.statusCode}, ${result.success}, ${result.attempt})
      ON CONFLICT (id) DO NOTHING
    `;
  } catch {
    /* non-fatal */
  }
}

export async function dispatchWebhook<T>(
  event: WebhookEventType,
  data: T,
  workspaceId?: string,
): Promise<void> {
  const neon = getNeon();
  if (!neon) return;

  type WebhookRow = { id: string; url: string; signing_secret: string };
  const rows = (workspaceId
    ? await neon`SELECT id, url, signing_secret FROM webhooks WHERE active = true AND events @> ${JSON.stringify([event])}::jsonb AND workspace_id = ${workspaceId}`
    : await neon`SELECT id, url, signing_secret FROM webhooks WHERE active = true AND events @> ${JSON.stringify([event])}::jsonb`) as unknown as WebhookRow[];

  if (!rows || rows.length === 0) return;

  const payloadId = `evt_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
  const payload: WebhookPayload<T> = {
    id: payloadId,
    event,
    createdAt: new Date().toISOString(),
    data,
  };

  await Promise.allSettled(
    rows.map(async (row: WebhookRow) => {
      const deliveryId = `del_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
      const result = await deliverWithRetry(row.id, row.url, payload, row.signing_secret);
      await recordDelivery(row.id, deliveryId, event, payload, result);
    }),
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
