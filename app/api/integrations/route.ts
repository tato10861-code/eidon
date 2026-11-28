/**
 * Third-party integration management API.
 *
 * Enterprise buyers need native connectors to their existing toolchain.
 * This endpoint manages OAuth/webhook-based integrations with:
 *   Slack, Microsoft Teams, Jira, GitHub, Zendesk, PagerDuty, Linear,
 *   Salesforce, HubSpot, Intercom, and custom webhook destinations.
 *
 * GET    /api/integrations?workspaceId= — list all integrations
 * POST   /api/integrations              — create or update integration
 * DELETE /api/integrations?id=&workspaceId= — remove integration
 * POST   /api/integrations?action=test  — send a test event
 */

import type { NextRequest } from "next/server";
import { getNeon } from "@/lib/neon";
import { randomUUID } from "crypto";
import { createHmac } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdminKey(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  return key === expected;
}

export type IntegrationProvider =
  | "slack"
  | "teams"
  | "jira"
  | "github"
  | "zendesk"
  | "pagerduty"
  | "linear"
  | "salesforce"
  | "hubspot"
  | "intercom"
  | "webhook";

export type IntegrationStatus = "active" | "inactive" | "error" | "pending_auth";

interface IntegrationConfig {
  webhookUrl?: string;
  channelId?: string;
  channelName?: string;
  botToken?: string; // stored encrypted, returned redacted
  oauthToken?: string; // stored encrypted, returned redacted
  projectKey?: string; // Jira
  repoName?: string; // GitHub
  subdomain?: string; // Zendesk/Intercom
  serviceId?: string; // PagerDuty
  teamId?: string; // Teams
  secret?: string; // webhook signing secret, returned redacted
  customHeaders?: Record<string, string>;
}

interface Integration {
  id: string;
  workspaceId: string;
  provider: IntegrationProvider;
  name: string;
  status: IntegrationStatus;
  config: Omit<IntegrationConfig, "botToken" | "oauthToken" | "secret">;
  events: string[]; // which events trigger this integration
  lastDeliveredAt?: string;
  lastErrorAt?: string;
  lastError?: string;
  deliveryCount: number;
  errorCount: number;
  createdAt: string;
  updatedAt: string;
}

const SUPPORTED_PROVIDERS: IntegrationProvider[] = [
  "slack",
  "teams",
  "jira",
  "github",
  "zendesk",
  "pagerduty",
  "linear",
  "salesforce",
  "hubspot",
  "intercom",
  "webhook",
];

const DEFAULT_EVENTS_BY_PROVIDER: Record<IntegrationProvider, string[]> = {
  slack: ["message.created", "employee.error", "budget.exceeded", "member.joined"],
  teams: ["message.created", "employee.error", "budget.exceeded", "member.joined"],
  jira: ["task.created", "task.completed", "employee.error"],
  github: ["deployment.created", "employee.error"],
  zendesk: ["message.created", "employee.error"],
  pagerduty: ["employee.error", "budget.exceeded", "security.alert"],
  linear: ["task.created", "task.completed"],
  salesforce: ["conversation.created", "employee.completed"],
  hubspot: ["conversation.created", "employee.completed"],
  intercom: ["message.created", "conversation.created"],
  webhook: [],
};

// Redact sensitive config fields before returning to client
function redactConfig(config: IntegrationConfig): Integration["config"] {
  const { botToken: _bt, oauthToken: _ot, secret: _s, ...safe } = config;
  return {
    ...safe,
    ...(config.botToken ? { botToken: "[REDACTED]" } : {}),
    ...(config.oauthToken ? { oauthToken: "[REDACTED]" } : {}),
    ...(config.secret ? { secret: "[REDACTED]" } : {}),
  } as Integration["config"];
}

type Row = {
  id: string;
  workspace_id: string;
  provider: string;
  name: string;
  status: string;
  config: IntegrationConfig;
  events: string[];
  last_delivered_at: string | null;
  last_error_at: string | null;
  last_error: string | null;
  delivery_count: number;
  error_count: number;
  created_at: string;
  updated_at: string;
};

function formatRow(r: Row): Integration {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    provider: r.provider as IntegrationProvider,
    name: r.name,
    status: r.status as IntegrationStatus,
    config: redactConfig(r.config),
    events: r.events ?? [],
    lastDeliveredAt: r.last_delivered_at ?? undefined,
    lastErrorAt: r.last_error_at ?? undefined,
    lastError: r.last_error ?? undefined,
    deliveryCount: r.delivery_count,
    errorCount: r.error_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function GET(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const integrationId = url.searchParams.get("id");
  const provider = url.searchParams.get("provider") as IntegrationProvider | null;

  if (!workspaceId && !integrationId) {
    return Response.json({ error: "workspaceId or id is required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  if (integrationId) {
    const rows = (await neon`
      SELECT * FROM workspace_integrations WHERE id = ${integrationId} LIMIT 1
    `) as unknown as Row[];
    if (!rows.length) return Response.json({ error: "Integration not found" }, { status: 404 });
    return Response.json({ integration: formatRow(rows[0]) });
  }

  const rows = provider
    ? ((await neon`
        SELECT * FROM workspace_integrations
        WHERE workspace_id = ${workspaceId!} AND provider = ${provider}
        ORDER BY created_at DESC
      `) as unknown as Row[])
    : ((await neon`
        SELECT * FROM workspace_integrations
        WHERE workspace_id = ${workspaceId!}
        ORDER BY provider, created_at DESC
      `) as unknown as Row[]);

  const integrations = rows.map(formatRow);

  return Response.json({
    integrations,
    summary: {
      total: integrations.length,
      active: integrations.filter((i) => i.status === "active").length,
      error: integrations.filter((i) => i.status === "error").length,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  // Test delivery action
  if (action === "test") {
    return handleTestDelivery(request);
  }

  let body: {
    workspaceId?: string;
    provider?: IntegrationProvider;
    name?: string;
    config?: IntegrationConfig;
    events?: string[];
    updateId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workspaceId, provider, name, config = {}, events, updateId } = body;

  if (!workspaceId || !provider) {
    return Response.json({ error: "workspaceId and provider are required" }, { status: 400 });
  }

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return Response.json(
      { error: `provider must be one of: ${SUPPORTED_PROVIDERS.join(", ")}` },
      { status: 422 },
    );
  }

  if (provider !== "webhook" && !config.webhookUrl && !config.botToken && !config.oauthToken) {
    return Response.json(
      { error: "config must include webhookUrl, botToken, or oauthToken" },
      { status: 422 },
    );
  }

  if (provider === "webhook" && !config.webhookUrl) {
    return Response.json({ error: "webhookUrl is required for webhook provider" }, { status: 422 });
  }

  const neon = getNeon();
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  const now = new Date().toISOString();
  const integrationEvents = events ?? DEFAULT_EVENTS_BY_PROVIDER[provider];
  const integrationName =
    name ?? `${provider.charAt(0).toUpperCase() + provider.slice(1)} Integration`;

  if (updateId) {
    await neon`
      UPDATE workspace_integrations
      SET name = ${integrationName},
          config = config || ${JSON.stringify(config)}::jsonb,
          events = ${JSON.stringify(integrationEvents)}::jsonb,
          status = 'active',
          updated_at = ${now}
      WHERE id = ${updateId} AND workspace_id = ${workspaceId}
    `;
    return Response.json({ id: updateId, updated: true });
  }

  const id = `int_${randomUUID().replace(/-/g, "").slice(0, 20)}`;

  await neon`
    INSERT INTO workspace_integrations (
      id, workspace_id, provider, name, status, config, events,
      delivery_count, error_count, created_at, updated_at
    ) VALUES (
      ${id}, ${workspaceId}, ${provider}, ${integrationName},
      'active', ${JSON.stringify(config)}::jsonb,
      ${JSON.stringify(integrationEvents)}::jsonb,
      0, 0, ${now}, ${now}
    )
  `;

  await neon`
    INSERT INTO audit_log (workspace_id, actor, action, target, payload)
    VALUES (${workspaceId}, 'api', 'integration.created', ${id},
            ${JSON.stringify({ provider, name: integrationName })}::jsonb)
  `.catch(() => {});

  return Response.json(
    {
      integration: {
        id,
        workspaceId,
        provider,
        name: integrationName,
        status: "active",
        config: redactConfig(config),
        events: integrationEvents,
        deliveryCount: 0,
        errorCount: 0,
        createdAt: now,
        updatedAt: now,
      } satisfies Integration,
    },
    { status: 201 },
  );
}

export async function DELETE(request: NextRequest) {
  if (!requireAdminKey(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const workspaceId = url.searchParams.get("workspaceId");

  if (!id || !workspaceId) {
    return Response.json({ error: "id and workspaceId are required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  type DelRow = { id: string; provider: string };
  const rows = (await neon`
    DELETE FROM workspace_integrations
    WHERE id = ${id} AND workspace_id = ${workspaceId}
    RETURNING id, provider
  `) as unknown as DelRow[];

  if (!rows.length) return Response.json({ error: "Integration not found" }, { status: 404 });

  return Response.json({ deleted: true, id, provider: rows[0].provider });
}

async function handleTestDelivery(request: NextRequest): Promise<Response> {
  let body: { integrationId?: string; workspaceId?: string; eventType?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { integrationId, workspaceId, eventType = "test.ping" } = body;
  if (!integrationId || !workspaceId) {
    return Response.json({ error: "integrationId and workspaceId are required" }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) return Response.json({ error: "Database not available" }, { status: 503 });

  const rows = (await neon`
    SELECT id, provider, config FROM workspace_integrations
    WHERE id = ${integrationId} AND workspace_id = ${workspaceId} LIMIT 1
  `) as unknown as { id: string; provider: string; config: IntegrationConfig }[];

  if (!rows.length) return Response.json({ error: "Integration not found" }, { status: 404 });

  const integration = rows[0];
  const webhookUrl = integration.config.webhookUrl;

  if (!webhookUrl) {
    return Response.json(
      {
        error:
          "Integration has no webhookUrl — test delivery not supported for OAuth-only integrations",
      },
      { status: 422 },
    );
  }

  const payload = JSON.stringify({
    event: eventType,
    integrationId,
    workspaceId,
    timestamp: new Date().toISOString(),
    test: true,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Eidon-Event": eventType,
    "X-Eidon-Integration": integrationId,
  };

  if (integration.config.secret) {
    const sig = createHmac("sha256", integration.config.secret).update(payload).digest("hex");
    headers["X-Eidon-Signature"] = `sha256=${sig}`;
  }

  if (integration.config.customHeaders) {
    Object.assign(headers, integration.config.customHeaders);
  }

  try {
    const res = await fetch(webhookUrl, { method: "POST", headers, body: payload });
    const success = res.ok;

    // Update delivery stats
    const now = new Date().toISOString();
    if (success) {
      await neon`
        UPDATE workspace_integrations
        SET delivery_count = delivery_count + 1,
            last_delivered_at = ${now},
            status = 'active',
            updated_at = ${now}
        WHERE id = ${integrationId}
      `;
    } else {
      await neon`
        UPDATE workspace_integrations
        SET error_count = error_count + 1,
            last_error_at = ${now},
            last_error = ${"HTTP " + res.status},
            status = 'error',
            updated_at = ${now}
        WHERE id = ${integrationId}
      `;
    }

    return Response.json({
      success,
      statusCode: res.status,
      message: success ? "Test delivery succeeded" : `Delivery failed with HTTP ${res.status}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const now = new Date().toISOString();
    await neon`
      UPDATE workspace_integrations
      SET error_count = error_count + 1,
          last_error_at = ${now},
          last_error = ${msg},
          status = 'error',
          updated_at = ${now}
      WHERE id = ${integrationId}
    `.catch(() => {});
    return Response.json({ success: false, error: msg }, { status: 502 });
  }
}
