import { scimResponse, SCIM_SCHEMAS, validateScimToken } from "@/lib/scim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/scim/v2/ServiceProviderConfig — advertise SCIM capabilities to IdPs. */
export function GET(request: Request) {
  const token = process.env.SCIM_TOKEN;
  if (token && !validateScimToken(request.headers.get("authorization"), token)) {
    return scimResponse(
      { schemas: [SCIM_SCHEMAS.error], status: 401, detail: "Unauthorized" },
      401,
    );
  }

  return scimResponse({
    schemas: [SCIM_SCHEMAS.serviceProviderConfig],
    documentationUri: "https://docs.eidon.ai/integrations/scim",
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 200 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: true },
    authenticationSchemes: [
      {
        type: "oauthbearertoken",
        name: "OAuth Bearer Token",
        description: "Authentication scheme using an OAuth2 Bearer Token",
        specUri: "https://www.rfc-editor.org/rfc/rfc6750",
        primary: true,
      },
    ],
    meta: {
      resourceType: "ServiceProviderConfig",
      location: "/api/scim/v2/ServiceProviderConfig",
      version: 'W/"eidon-scim-v1"',
    },
  });
}
