/**
 * Notification preferences API.
 *
 * Enterprise buyers need:
 *   - Per-user, per-workspace notification control (security alerts, billing, member activity)
 *   - Delivery channel selection (email, in-app, Slack webhook, PagerDuty)
 *   - Digest scheduling (immediate, hourly, daily)
 *   - Programmatic muting (incident response, maintenance windows)
 *
 * GET  /api/notifications?memberId=&workspaceId= — get preferences
 * PATCH /api/notifications — update preferences
 * POST /api/notifications?action=send — send a notification (internal/admin)
 */

import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdminKey(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  return key === expected;
}

export type NotificationChannel = "email" | "in_app" | "slack_webhook" | "pagerduty";
export type DigestFrequency = "immediate" | "hourly" | "daily" | "never";

export interface NotificationCategory {
  /** Channel flags: which delivery channels are on. */
  channels: Partial<Record<NotificationChannel, boolean>>;
  digest: DigestFrequency;
  /** If set, suppress delivery until this ISO timestamp. */
  mutedUntil?: string;
}

export interface NotificationPreferences {
  memberId: string;
  workspaceId: string;
  /**
   * Per-category preferences.
   * Keys: security, billing, members, employees, usage, system
   */
  categories: Record<string, NotificationCategory>;
  /** Global mute override — takes precedence over per-category settings. */
  globalMutedUntil?: string;
  /** Slack webhook for personal notifications (distinct from workspace webhooks). */
  slackWebhookUrl?: string;
  /** PagerDuty routing key for escalated alerts. */
  pagerdutyRoutingKey?: string;
  updatedAt: string;
}

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, "memberId" | "workspaceId" | "updatedAt"> =
  {
    categories: {
      security: {
        channels: { email: true, in_app: true },
        digest: "immediate",
      },
      billing: {
        channels: { email: true, in_app: true },
        digest: "daily",
      },
      members: {
        channels: { in_app: true },
        digest: "daily",
      },
      employees: {
        channels: { in_app: true },
        digest: "daily",
      },
      usage: {
        channels: { email: true },
        digest: "daily",
      },
      system: {
        channels: { email: true, in_app: true },
        digest: "immediate",
      },
    },
  };

const VALID_CATEGORIES = ["security", "billing", "members", "employees", "usage", "system"];
const VALID_CHANNELS: NotificationChannel[] = ["email", "in_app", "slack_webhook", "pagerduty"];
const VALID_DIGESTS: DigestFrequency[] = ["immediate", "hourly", "daily", "never"];

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const memberId = url.searchParams.get("memberId");
  const workspaceId = url.searchParams.get("workspaceId");

  if (!memberId || !workspaceId) {
    return Response.json({ error: "memberId and workspaceId are required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  type Row = {
    preferences: unknown;
    updated_at: string;
  };
  const rows = (await neon`
    SELECT preferences, updated_at FROM notification_preferences
    WHERE member_id = ${memberId} AND workspace_id = ${workspaceId}
    LIMIT 1
  `) as unknown as Row[];

  if (!rows.length) {
    // Return defaults — the row is created on first PATCH
    const prefs: NotificationPreferences = {
      memberId,
      workspaceId,
      ...DEFAULT_PREFERENCES,
      updatedAt: new Date().toISOString(),
    };
    return Response.json({ preferences: prefs });
  }

  const stored = rows[0].preferences as Partial<NotificationPreferences>;
  const prefs: NotificationPreferences = {
    memberId,
    workspaceId,
    categories: { ...DEFAULT_PREFERENCES.categories, ...stored.categories },
    globalMutedUntil: stored.globalMutedUntil,
    slackWebhookUrl: stored.slackWebhookUrl,
    pagerdutyRoutingKey: stored.pagerdutyRoutingKey,
    updatedAt: rows[0].updated_at,
  };

  return Response.json({ preferences: prefs });
}

export async function PATCH(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    memberId?: string;
    workspaceId?: string;
    categories?: Partial<Record<string, Partial<NotificationCategory>>>;
    globalMutedUntil?: string | null;
    slackWebhookUrl?: string | null;
    pagerdutyRoutingKey?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { memberId, workspaceId, categories } = body;
  if (!memberId || !workspaceId) {
    return Response.json({ error: "memberId and workspaceId are required" }, { status: 400 });
  }

  // Validate category names and values
  if (categories) {
    for (const [cat, prefs] of Object.entries(categories)) {
      if (!VALID_CATEGORIES.includes(cat)) {
        return Response.json(
          { error: `Unknown category '${cat}'. Valid: ${VALID_CATEGORIES.join(", ")}` },
          { status: 422 },
        );
      }
      if (prefs?.channels) {
        for (const ch of Object.keys(prefs.channels)) {
          if (!VALID_CHANNELS.includes(ch as NotificationChannel)) {
            return Response.json(
              { error: `Unknown channel '${ch}'. Valid: ${VALID_CHANNELS.join(", ")}` },
              { status: 422 },
            );
          }
        }
      }
      if (prefs?.digest && !VALID_DIGESTS.includes(prefs.digest)) {
        return Response.json(
          {
            error: `Unknown digest frequency '${prefs.digest}'. Valid: ${VALID_DIGESTS.join(", ")}`,
          },
          { status: 422 },
        );
      }
    }
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const delta: Record<string, unknown> = {};
  if (categories !== undefined) delta.categories = categories;
  if ("globalMutedUntil" in body) delta.globalMutedUntil = body.globalMutedUntil;
  if ("slackWebhookUrl" in body) delta.slackWebhookUrl = body.slackWebhookUrl;
  if ("pagerdutyRoutingKey" in body) delta.pagerdutyRoutingKey = body.pagerdutyRoutingKey;

  await neon`
    INSERT INTO notification_preferences (member_id, workspace_id, preferences, updated_at)
    VALUES (${memberId}, ${workspaceId}, ${JSON.stringify(delta)}::jsonb, ${now})
    ON CONFLICT (member_id, workspace_id)
    DO UPDATE SET
      preferences = notification_preferences.preferences || ${JSON.stringify(delta)}::jsonb,
      updated_at = ${now}
  `;

  // Re-fetch to return the merged result
  type Row = { preferences: unknown; updated_at: string };
  const rows = (await neon`
    SELECT preferences, updated_at FROM notification_preferences
    WHERE member_id = ${memberId} AND workspace_id = ${workspaceId}
    LIMIT 1
  `) as unknown as Row[];

  const stored = (rows[0]?.preferences as Partial<NotificationPreferences>) ?? {};
  const result: NotificationPreferences = {
    memberId,
    workspaceId,
    categories: { ...DEFAULT_PREFERENCES.categories, ...stored.categories },
    globalMutedUntil: stored.globalMutedUntil,
    slackWebhookUrl: stored.slackWebhookUrl,
    pagerdutyRoutingKey: stored.pagerdutyRoutingKey,
    updatedAt: rows[0]?.updated_at ?? now,
  };

  return Response.json({ preferences: result });
}

export async function POST(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  if (action !== "send") {
    return Response.json({ error: "action=send is required" }, { status: 400 });
  }

  let body: {
    workspaceId?: string;
    memberId?: string;
    category?: string;
    title?: string;
    message?: string;
    severity?: "info" | "warning" | "critical";
    metadata?: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workspaceId, category, title, message, severity = "info" } = body;
  if (!workspaceId || !category || !title || !message) {
    return Response.json(
      { error: "workspaceId, category, title, and message are required" },
      { status: 400 },
    );
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const notifId = `notif_${Date.now()}`;

  await neon`
    INSERT INTO notifications (id, workspace_id, member_id, category, title, message, severity, metadata, created_at)
    VALUES (
      ${notifId}, ${workspaceId}, ${body.memberId ?? null},
      ${category}, ${title}, ${message}, ${severity},
      ${JSON.stringify(body.metadata ?? {})}::jsonb, ${now}
    )
  `.catch(() => {});

  return Response.json({ id: notifId, status: "queued", createdAt: now }, { status: 202 });
}
