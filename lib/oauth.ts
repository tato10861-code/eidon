import crypto from "node:crypto";

// OAuth provider registry for live tool execution.

export interface OAuthProvider {
  id: string;
  name: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
}

export const oauthProviders: Record<string, OAuthProvider> = {
  hubspot: {
    id: "hubspot",
    name: "HubSpot",
    authorizeUrl: "https://app.hubspot.com/oauth/authorize",
    tokenUrl: "https://api.hubapi.com/oauth/v1/token",
    scopes: ["crm.objects.contacts.read", "crm.objects.contacts.write", "crm.objects.deals.read"],
    clientIdEnv: "HUBSPOT_CLIENT_ID",
    clientSecretEnv: "HUBSPOT_CLIENT_SECRET",
  },
  slack: {
    id: "slack",
    name: "Slack",
    authorizeUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: ["chat:write", "channels:read", "users:read"],
    clientIdEnv: "SLACK_CLIENT_ID",
    clientSecretEnv: "SLACK_CLIENT_SECRET",
  },
  github: {
    id: "github",
    name: "GitHub",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["repo", "read:org"],
    clientIdEnv: "GITHUB_CLIENT_ID",
    clientSecretEnv: "GITHUB_CLIENT_SECRET",
  },
  google: {
    id: "google",
    name: "Google",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/gmail.readonly",
    ],
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  },
};

export function getProvider(id: string) {
  return oauthProviders[id];
}

export function isProviderConfigured(id: string) {
  const p = oauthProviders[id];
  if (!p) return false;
  return Boolean(process.env[p.clientIdEnv] && process.env[p.clientSecretEnv]);
}

export function buildAuthorizeUrl(
  id: string,
  redirectUri: string,
  state: string,
  codeChallenge?: string,
) {
  const p = oauthProviders[id];
  if (!p) return null;
  const params = new URLSearchParams({
    client_id: process.env[p.clientIdEnv] ?? "demo-client",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: p.scopes.join(" "),
    state,
  });
  if (codeChallenge) {
    params.set("code_challenge", codeChallenge);
    params.set("code_challenge_method", "S256");
  }
  return `${p.authorizeUrl}?${params.toString()}`;
}

function stateSecret() {
  return process.env.EIDON_OAUTH_STATE_SECRET;
}

export function createCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}

export function createCodeChallenge(verifier: string) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export function createOAuthState(provider: string, workspaceId: string) {
  const secret = stateSecret();
  if (!secret) return null;
  const payload = Buffer.from(
    JSON.stringify({
      provider,
      workspaceId,
      exp: Date.now() + 10 * 60_000,
      nonce: crypto.randomUUID(),
    }),
  ).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyOAuthState(value: string | null, provider: string, workspaceId: string) {
  if (!value) return false;
  const secret = stateSecret();
  if (!secret) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      provider?: string;
      workspaceId?: string;
      exp?: number;
    };
    return (
      data.provider === provider &&
      data.workspaceId === workspaceId &&
      typeof data.exp === "number" &&
      data.exp > Date.now()
    );
  } catch {
    return false;
  }
}
