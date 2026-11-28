/**
 * Eidon SDK — typed client for the Eidon platform API.
 *
 * Usage:
 *   import { EidonClient } from "@/lib/sdk";
 *   const eidon = new EidonClient({ baseUrl: "https://app.eidon.ai", adminKey: "..." });
 *   const ws = await eidon.workspaces.provision({ name: "Acme Corp", ownerEmail: "admin@acme.com" });
 *   const result = await eidon.evals.run({ suiteId: "...", workspaceId: ws.workspaceId });
 *
 * The SDK is framework-agnostic (works in Node.js, Deno, edge runtimes, browsers).
 * All methods throw `EidonError` on non-2xx responses.
 */

export interface EidonClientConfig {
  baseUrl?: string;
  adminKey?: string;
  scimToken?: string;
  timeout?: number;
}

export class EidonError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(`EidonError ${status}: ${message}`);
    this.name = "EidonError";
  }
}

export class EidonClient {
  private readonly baseUrl: string;
  private readonly adminKey: string;
  private readonly scimToken: string;
  private readonly timeout: number;

  readonly workspaces: WorkspacesAPI;
  readonly members: MembersAPI;
  readonly evals: EvalsAPI;
  readonly analytics: AnalyticsAPI;
  readonly webhooks: WebhooksAPI;
  readonly security: SecurityAPI;
  readonly compliance: ComplianceAPI;
  readonly sso: SSOAPI;
  readonly scim: ScimAPI;

  constructor(config: EidonClientConfig = {}) {
    this.baseUrl = (
      config.baseUrl ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000"
    ).replace(/\/$/, "");
    this.adminKey = config.adminKey ?? process.env.ADMIN_API_KEY ?? "";
    this.scimToken = config.scimToken ?? process.env.SCIM_TOKEN ?? "";
    this.timeout = config.timeout ?? 30_000;

    this.workspaces = new WorkspacesAPI(this);
    this.members = new MembersAPI(this);
    this.evals = new EvalsAPI(this);
    this.analytics = new AnalyticsAPI(this);
    this.webhooks = new WebhooksAPI(this);
    this.security = new SecurityAPI(this);
    this.compliance = new ComplianceAPI(this);
    this.sso = new SSOAPI(this);
    this.scim = new ScimAPI(this);
  }

  async request<T>(
    method: string,
    path: string,
    options: { body?: unknown; headers?: Record<string, string>; scim?: boolean } = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "eidon-sdk/1.0",
      ...options.headers,
    };

    if (options.scim) {
      headers["Authorization"] = `Bearer ${this.scimToken}`;
    } else {
      headers["x-admin-key"] = this.adminKey;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = await response.text().catch(() => null);
      }
      const message =
        typeof body === "object" && body !== null && "error" in body
          ? String((body as { error: unknown }).error)
          : response.statusText;
      throw new EidonError(response.status, message, body);
    }

    return response.json() as Promise<T>;
  }
}

// ─── Sub-APIs ─────────────────────────────────────────────────────────────────

class WorkspacesAPI {
  constructor(private readonly client: EidonClient) {}

  async provision(params: {
    name: string;
    ownerEmail: string;
    plan?: "free" | "starter" | "pro" | "enterprise";
    seats?: number;
    slug?: string;
    sso?: { provider: "saml" | "oidc"; domain: string };
    generateScimToken?: boolean;
    ipAllowlist?: string[];
    settings?: Record<string, unknown>;
  }) {
    return this.client.request<{
      workspaceId: string;
      name: string;
      slug: string;
      plan: string;
      seats: number;
      ownerEmail: string;
      sso: {
        provider: string;
        domain: string;
        metadataUrl: string;
        acsUrl: string;
        entityId: string;
      } | null;
      scim: { baseUrl: string; token: string; note: string } | null;
      createdAt: string;
    }>("POST", "/api/workspaces/provision", { body: params });
  }

  async getSettings(workspaceId: string) {
    return this.client.request<Record<string, unknown>>(
      "GET",
      `/api/workspaces/settings?workspaceId=${encodeURIComponent(workspaceId)}`,
    );
  }

  async updateSettings(workspaceId: string, settings: Record<string, unknown>) {
    return this.client.request<{ ok: boolean }>("PATCH", "/api/workspaces/settings", {
      body: { workspaceId, settings },
    });
  }
}

class MembersAPI {
  constructor(private readonly client: EidonClient) {}

  async list(workspaceId: string, page = 1, limit = 25) {
    return this.client.request<{ members: unknown[]; pagination: unknown }>(
      "GET",
      `/api/workspaces/members?workspaceId=${encodeURIComponent(workspaceId)}&page=${page}&limit=${limit}`,
    );
  }

  async invite(params: { workspaceId: string; email: string; role?: string; invitedBy?: string }) {
    return this.client.request<{ id: string; email: string; role: string }>(
      "POST",
      "/api/workspaces/members",
      { body: params },
    );
  }

  async changeRole(params: {
    workspaceId: string;
    memberId: string;
    role: string;
    changedBy?: string;
  }) {
    return this.client.request<{ ok: boolean }>("PATCH", "/api/workspaces/members", {
      body: params,
    });
  }

  async remove(workspaceId: string, memberId: string) {
    return this.client.request<{ ok: boolean }>(
      "DELETE",
      `/api/workspaces/members?workspaceId=${encodeURIComponent(workspaceId)}&memberId=${encodeURIComponent(memberId)}`,
    );
  }
}

class EvalsAPI {
  constructor(private readonly client: EidonClient) {}

  async createSuite(params: {
    name: string;
    cases: unknown[];
    workspaceId?: string;
    employeeId?: string;
    description?: string;
  }) {
    return this.client.request<{ id: string; name: string; createdAt: string }>(
      "POST",
      "/api/evals",
      { body: { action: "create_suite", ...params } },
    );
  }

  async run(params: {
    suiteId: string;
    workspaceId?: string;
    employeeId?: string;
    model?: string;
  }) {
    return this.client.request<{
      runId: string;
      score: number;
      passedCases: number;
      totalCases: number;
      cases: unknown[];
    }>("POST", "/api/evals", { body: { action: "run_suite", ...params } });
  }

  async scoreResponse(params: { response: string; evalCase: unknown }) {
    return this.client.request<{ score: number; passed: boolean; scores: unknown[] }>(
      "POST",
      "/api/evals",
      { body: { action: "score_response", ...params } },
    );
  }
}

class AnalyticsAPI {
  constructor(private readonly client: EidonClient) {}

  async get(
    workspaceId: string,
    period: "7d" | "30d" | "90d" | "1y" = "30d",
    breakdown?: "employee" | "model",
  ) {
    const params = new URLSearchParams({ workspaceId, period });
    if (breakdown) params.set("breakdown", breakdown);
    return this.client.request<{
      summary: {
        totalConversations: number;
        totalMessages: number;
        totalTokens: number;
        estimatedCostUsd: number;
      };
      series: { day: string; conversations: number }[];
    }>("GET", `/api/analytics?${params}`);
  }
}

class WebhooksAPI {
  constructor(private readonly client: EidonClient) {}

  async list(workspaceId: string) {
    return this.client.request<{ webhooks: unknown[] }>(
      "GET",
      `/api/webhooks?workspaceId=${encodeURIComponent(workspaceId)}`,
    );
  }

  async create(params: {
    workspaceId: string;
    url: string;
    events: string[];
    description?: string;
  }) {
    return this.client.request<{ id: string; url: string; signingSecret: string }>(
      "POST",
      "/api/webhooks",
      { body: params },
    );
  }
}

class SecurityAPI {
  constructor(private readonly client: EidonClient) {}

  async getAllowlist(workspaceId: string) {
    return this.client.request<{ allowlist: string[] }>(
      "GET",
      `/api/security/allowlist?workspaceId=${encodeURIComponent(workspaceId)}`,
    );
  }

  async setAllowlist(workspaceId: string, entries: string[]) {
    return this.client.request<{ ok: boolean }>("PUT", "/api/security/allowlist", {
      body: { workspaceId, entries },
    });
  }

  async listSessions(workspaceId: string) {
    return this.client.request<{ sessions: unknown[] }>(
      "GET",
      `/api/security/sessions?workspaceId=${encodeURIComponent(workspaceId)}`,
    );
  }

  async revokeSessions(workspaceId: string, all = false, userId?: string) {
    const params = new URLSearchParams({ workspaceId });
    if (all) params.set("all", "1");
    if (userId) params.set("userId", userId);
    return this.client.request<{ ok: boolean }>("DELETE", `/api/security/sessions?${params}`);
  }
}

class ComplianceAPI {
  constructor(private readonly client: EidonClient) {}

  async export(params: {
    workspaceId: string;
    requestedBy: string;
    format?: "json";
    scope?: string[];
    since?: string;
    until?: string;
  }) {
    return this.client.request<Record<string, unknown>>("POST", "/api/compliance/export", {
      body: params,
    });
  }
}

class SSOAPI {
  constructor(private readonly client: EidonClient) {}

  async getConfig(workspaceId: string) {
    return this.client.request<{
      ssoProvider: string | null;
      ssoDomain: string | null;
      configured: boolean;
      metadataUrl: string;
    }>("GET", `/api/auth/sso?workspaceId=${encodeURIComponent(workspaceId)}`);
  }

  async configure(params: {
    workspaceId: string;
    provider: "saml" | "oidc";
    domain?: string;
    samlIdpMetadataUrl?: string;
    oidcDiscoveryUrl?: string;
  }) {
    return this.client.request<{ ok: boolean; metadataUrl: string }>("POST", "/api/auth/sso", {
      body: params,
    });
  }

  metadataUrl(baseUrl: string, workspaceId: string) {
    return `${baseUrl}/api/auth/sso?workspaceId=${encodeURIComponent(workspaceId)}&metadata=1`;
  }
}

class ScimAPI {
  constructor(private readonly client: EidonClient) {}

  async listUsers(
    workspaceId: string,
    params: { filter?: string; startIndex?: number; count?: number } = {},
  ) {
    const qs = new URLSearchParams();
    if (params.filter) qs.set("filter", params.filter);
    if (params.startIndex) qs.set("startIndex", String(params.startIndex));
    if (params.count) qs.set("count", String(params.count));
    return this.client.request<{ totalResults: number; Resources: unknown[] }>(
      "GET",
      `/api/scim/v2/Users${qs.toString() ? "?" + qs : ""}`,
      { scim: true, headers: { "x-scim-workspace-id": workspaceId } },
    );
  }

  async provisionUser(
    workspaceId: string,
    user: {
      userName: string;
      emails: { value: string; primary: boolean }[];
      name?: { givenName?: string; familyName?: string };
      active?: boolean;
    },
  ) {
    return this.client.request<{ id: string; userName: string }>("POST", "/api/scim/v2/Users", {
      scim: true,
      headers: { "x-scim-workspace-id": workspaceId },
      body: user,
    });
  }
}
