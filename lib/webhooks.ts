import crypto from "node:crypto";
import dns from "node:dns/promises";
import https from "node:https";
import net from "node:net";
import { getNeon } from "./neon";
import { decryptSecret } from "./security/secrets";

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

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized.startsWith("::ffff:")) return isPrivateIp(normalized.slice(7));
    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb") ||
      normalized.startsWith("ff")
    );
  }
  return true;
}

async function resolveWebhookTarget(rawUrl: string) {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port === "80")
    throw new Error("private or non-HTTPS target");
  const addresses = await dns.lookup(parsed.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address)))
    throw new Error("private or unresolved target");
  return { parsed, addresses: addresses.map(({ address }) => address) };
}

export async function validateWebhookTarget(rawUrl: string) {
  return (await resolveWebhookTarget(rawUrl)).parsed;
}

function requestPinned(
  parsed: URL,
  address: string,
  body: string,
  headers: Record<string, string>,
) {
  return new Promise<number>((resolve, reject) => {
    const request = https.request(
      {
        protocol: parsed.protocol,
        hostname: address,
        port: parsed.port ? Number(parsed.port) : 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: "POST",
        servername: parsed.hostname,
        headers: {
          ...headers,
          Host: parsed.host,
          "Content-Length": String(Buffer.byteLength(body)),
        },
        timeout: 10_000,
        rejectUnauthorized: true,
      },
      (response) => {
        response.resume();
        response.once("end", () => resolve(response.statusCode ?? 0));
      },
    );
    request.once("timeout", () => request.destroy(new Error("webhook request timed out")));
    request.once("error", reject);
    request.end(body);
  });
}

async function deliverOne(
  webhookId: string,
  url: string,
  payload: WebhookPayload,
  secret: string,
): Promise<boolean> {
  const body = JSON.stringify(payload);
  const sig = sign(secret, body);
  const target = await resolveWebhookTarget(url);
  let statusCode: number | null = null;
  let success = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      statusCode = await requestPinned(target.parsed, target.addresses[0], body, {
        "Content-Type": "application/json",
        "X-Eidon-Signature": sig,
        "X-Eidon-Event": payload.event,
        "X-Eidon-Delivery": payload.id,
        "User-Agent": "Eidon-Webhooks/1.0",
      });
      success = statusCode >= 200 && statusCode < 300;
    } catch {
      success = false;
    }
    const neon = getNeon();
    if (neon) {
      await neon`
        insert into webhook_deliveries (id, webhook_id, event, payload, status_code, success, attempt)
        values (${`${payload.id}_${attempt}`}, ${webhookId}, ${payload.event}, ${body}::jsonb, ${statusCode}, ${success}, ${attempt})
      `;
    }
    if (success || (statusCode !== null && statusCode < 500)) break;
    await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** (attempt - 1)));
  }
  return success;
}

export async function dispatchWebhook<T>(
  event: WebhookEventType,
  data: T,
  workspaceId?: string,
): Promise<void> {
  const neon = getNeon();
  if (!neon) return;
  type WebhookRow = { id: string; url: string; signing_secret: string };
  const rows = (
    workspaceId
      ? await neon`SELECT id, url, signing_secret FROM webhooks WHERE active = true AND events @> ${JSON.stringify([event])}::jsonb AND workspace_id = ${workspaceId}`
      : await neon`SELECT id, url, signing_secret FROM webhooks WHERE active = true AND events @> ${JSON.stringify([event])}::jsonb`
  ) as WebhookRow[];
  if (!rows?.length) return;
  const payload: WebhookPayload<T> = {
    id: `evt_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`,
    event,
    createdAt: new Date().toISOString(),
    data,
  };
  await Promise.allSettled(
    rows.map(async (row) => {
      try {
        await validateWebhookTarget(row.url);
        return deliverOne(row.id, row.url, payload, decryptSecret(row.signing_secret));
      } catch {
        return false;
      }
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
