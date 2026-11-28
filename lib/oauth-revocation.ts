import { getProvider } from "@/lib/oauth";

export type RevocationRequest = {
  url: string;
  method: "POST" | "DELETE";
  headers: Record<string, string>;
  body?: string;
};

function basicAuth(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

export function buildRevocationRequest(
  providerId: string,
  token: string,
  kind: "access" | "refresh" = "access",
): RevocationRequest | null {
  const provider = getProvider(providerId);
  if (!provider || !token) return null;
  const clientId = process.env[provider.clientIdEnv];
  const clientSecret = process.env[provider.clientSecretEnv];
  if (!clientId || !clientSecret) return null;

  switch (providerId) {
    case "github":
      return {
        url: `https://api.github.com/applications/${encodeURIComponent(clientId)}/token`,
        method: "DELETE",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: basicAuth(clientId, clientSecret),
          "Content-Type": "application/json",
          "User-Agent": "Eidon-OAuth-Revoke/1.0",
        },
        body: JSON.stringify({ access_token: token }),
      };
    case "slack":
      return {
        url: "https://slack.com/api/auth.revoke",
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ token }).toString(),
      };
    case "google":
      return {
        url: `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
        method: "POST",
        headers: { Accept: "application/json" },
      };
    case "hubspot":
      if (kind !== "refresh") return null;
      return {
        url: `https://api.hubapi.com/oauth/v1/refresh-tokens/${encodeURIComponent(token)}`,
        method: "DELETE",
        headers: { Accept: "application/json" },
      };
    default:
      return null;
  }
}

export async function revokeOAuthToken(
  providerId: string,
  token: string,
  kind: "access" | "refresh" = "access",
  fetchImpl: typeof fetch = fetch,
) {
  const request = buildRevocationRequest(providerId, token, kind);
  if (!request) return { supported: false, revoked: false } as const;
  const response = await fetchImpl(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`OAuth revocation failed with ${response.status}`);
  if (providerId === "slack") {
    const result = (await response.json()) as { ok?: boolean };
    if (result.ok !== true) throw new Error("Slack rejected OAuth revocation");
  }
  return { supported: true, revoked: true } as const;
}
