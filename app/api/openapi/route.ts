/**
 * OpenAPI 3.1 spec endpoint — machine-readable API documentation.
 *
 * GET /api/openapi          — returns the full spec as JSON
 * GET /api/openapi?format=yaml — returns YAML (requires js-yaml; falls back to JSON)
 *
 * Enterprise buyers and integration teams expect a published spec so they
 * can generate SDK clients and validate payloads without reading source code.
 */

import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildSpec(baseUrl: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Eidon AI Workforce API",
      version: "1.0.0",
      description:
        "The Eidon platform API for managing AI employees, conversations, webhooks, SCIM provisioning, and enterprise security.",
      contact: { name: "Eidon Support", email: "api@eidon.ai", url: "https://eidon.ai/docs" },
      license: { name: "Commercial", url: "https://eidon.ai/license" },
    },
    servers: [
      { url: baseUrl, description: "Current deployment" },
      { url: "https://app.eidon.ai", description: "Production" },
    ],
    tags: [
      { name: "Conversations", description: "AI employee conversations" },
      { name: "Employees", description: "AI employee management" },
      { name: "Webhooks", description: "Event webhook subscriptions" },
      { name: "SCIM", description: "SCIM 2.0 user provisioning (RFC 7643/7644)" },
      { name: "Members", description: "Workspace member management" },
      { name: "SSO", description: "Single sign-on configuration" },
      { name: "Security", description: "IP allowlists and session management" },
      { name: "Compliance", description: "GDPR/CCPA data export" },
      { name: "Evals", description: "AI response evaluation framework" },
      { name: "Billing", description: "Subscription and usage management" },
    ],
    components: {
      securitySchemes: {
        AdminKey: {
          type: "apiKey",
          in: "header",
          name: "x-admin-key",
          description: "Admin API key — set via ADMIN_API_KEY environment variable",
        },
        ScimToken: {
          type: "http",
          scheme: "bearer",
          description: "SCIM bearer token — set via SCIM_TOKEN environment variable",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
          required: ["error"],
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            total: { type: "integer" },
            pages: { type: "integer" },
          },
        },
        WorkspaceRole: {
          type: "string",
          enum: ["owner", "admin", "member", "viewer"],
        },
        Member: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            workspaceId: { type: "string" },
            email: { type: "string", format: "email" },
            role: { $ref: "#/components/schemas/WorkspaceRole" },
            joinedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        EvalCase: {
          type: "object",
          properties: {
            id: { type: "string" },
            description: { type: "string" },
            messages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: { type: "string", enum: ["user", "assistant"] },
                  content: { type: "string" },
                },
                required: ["role", "content"],
              },
            },
            expected: { type: "string" },
            scorers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["exact_match", "contains", "regex", "llm_judge"] },
                  value: { type: "string" },
                  rubric: { type: "string" },
                  weight: { type: "number" },
                },
                required: ["type"],
              },
            },
            tags: { type: "array", items: { type: "string" } },
          },
          required: ["id", "messages", "scorers"],
        },
        EvalResult: {
          type: "object",
          properties: {
            suiteId: { type: "string" },
            runId: { type: "string", format: "uuid" },
            employeeId: { type: "string", nullable: true },
            model: { type: "string", nullable: true },
            startedAt: { type: "string", format: "date-time" },
            finishedAt: { type: "string", format: "date-time" },
            durationMs: { type: "integer" },
            passedCases: { type: "integer" },
            failedCases: { type: "integer" },
            totalCases: { type: "integer" },
            score: { type: "number", minimum: 0, maximum: 1 },
            cases: { type: "array", items: { type: "object" } },
          },
        },
      },
    },
    security: [{ AdminKey: [] }],
    paths: {
      "/api/chat": {
        post: {
          tags: ["Conversations"],
          summary: "Send a message to an AI employee",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    messages: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          role: { type: "string", enum: ["user", "assistant"] },
                          content: { type: "string" },
                        },
                      },
                    },
                    employeeId: { type: "string" },
                    workspaceId: { type: "string" },
                    stream: { type: "boolean", default: true },
                  },
                  required: ["messages"],
                },
              },
            },
          },
          responses: {
            "200": { description: "AI response (streaming or JSON)" },
            "400": {
              description: "Bad request",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
          },
        },
      },
      "/api/webhooks": {
        get: {
          tags: ["Webhooks"],
          summary: "List webhook endpoints for a workspace",
          parameters: [{ name: "workspaceId", in: "query", schema: { type: "string" } }],
          responses: { "200": { description: "List of webhook endpoints" } },
        },
        post: {
          tags: ["Webhooks"],
          summary: "Register a webhook endpoint",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    workspaceId: { type: "string" },
                    url: { type: "string", format: "uri" },
                    events: { type: "array", items: { type: "string" } },
                    description: { type: "string" },
                  },
                  required: ["workspaceId", "url", "events"],
                },
              },
            },
          },
          responses: {
            "201": { description: "Webhook registered" },
            "422": { description: "Validation error" },
          },
        },
      },
      "/api/workspaces/members": {
        get: {
          tags: ["Members"],
          summary: "List workspace members",
          parameters: [
            { name: "workspaceId", in: "query", required: true, schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 25, maximum: 100 } },
          ],
          responses: {
            "200": {
              description: "Member list with pagination",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      members: { type: "array", items: { $ref: "#/components/schemas/Member" } },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Members"],
          summary: "Invite a member to a workspace",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    workspaceId: { type: "string" },
                    email: { type: "string", format: "email" },
                    role: { $ref: "#/components/schemas/WorkspaceRole" },
                    invitedBy: { type: "string" },
                  },
                  required: ["workspaceId", "email"],
                },
              },
            },
          },
          responses: {
            "201": { description: "Member invited" },
            "409": { description: "Member already exists" },
            "422": { description: "Invalid role" },
          },
        },
        patch: {
          tags: ["Members"],
          summary: "Change a member's role",
          responses: { "200": { description: "Role updated" } },
        },
        delete: {
          tags: ["Members"],
          summary: "Remove a member from a workspace",
          parameters: [
            { name: "workspaceId", in: "query", required: true, schema: { type: "string" } },
            { name: "memberId", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Member removed" },
            "403": { description: "Cannot remove workspace owner" },
            "404": { description: "Member not found" },
          },
        },
      },
      "/api/auth/sso": {
        get: {
          tags: ["SSO"],
          summary: "Get SSO configuration or SAML SP metadata",
          parameters: [
            { name: "workspaceId", in: "query", required: true, schema: { type: "string" } },
            {
              name: "metadata",
              in: "query",
              schema: { type: "string", enum: ["1"] },
              description: "Return SAML SP metadata XML (no auth required)",
            },
          ],
          responses: {
            "200": { description: "SSO config or SAML XML metadata" },
          },
        },
        post: {
          tags: ["SSO"],
          summary: "Configure SSO for a workspace",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    workspaceId: { type: "string" },
                    provider: { type: "string", enum: ["saml", "oidc"] },
                    domain: { type: "string" },
                    samlIdpMetadataUrl: { type: "string", format: "uri" },
                    oidcDiscoveryUrl: { type: "string", format: "uri" },
                  },
                  required: ["workspaceId", "provider"],
                },
              },
            },
          },
          responses: { "200": { description: "SSO configured" } },
        },
      },
      "/api/security/allowlist": {
        get: { tags: ["Security"], summary: "Get IP allowlist for a workspace" },
        put: { tags: ["Security"], summary: "Update IP allowlist" },
        delete: { tags: ["Security"], summary: "Clear IP allowlist (allow all)" },
      },
      "/api/security/sessions": {
        get: { tags: ["Security"], summary: "List active sessions" },
        delete: { tags: ["Security"], summary: "Revoke sessions" },
      },
      "/api/compliance/export": {
        post: {
          tags: ["Compliance"],
          summary: "Export workspace data (GDPR/CCPA DSAR)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    workspaceId: { type: "string" },
                    requestedBy: { type: "string" },
                    format: { type: "string", enum: ["json"], default: "json" },
                    scope: {
                      type: "array",
                      items: {
                        type: "string",
                        enum: [
                          "conversations",
                          "employees",
                          "audit",
                          "members",
                          "api_keys",
                          "usage",
                        ],
                      },
                    },
                    since: { type: "string", format: "date-time" },
                    until: { type: "string", format: "date-time" },
                  },
                  required: ["workspaceId", "requestedBy"],
                },
              },
            },
          },
          responses: {
            "200": { description: "Export file (JSON attachment)" },
          },
        },
      },
      "/api/evals": {
        get: {
          tags: ["Evals"],
          summary: "List eval suites or get a specific suite",
          parameters: [
            { name: "workspaceId", in: "query", schema: { type: "string" } },
            { name: "suiteId", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "Eval suites" } },
        },
        post: {
          tags: ["Evals"],
          summary: "Create a suite, run a suite, or score a single response",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    action: {
                      type: "string",
                      enum: ["create_suite", "run_suite", "score_response"],
                    },
                  },
                  required: ["action"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Eval result",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/EvalResult" } },
              },
            },
            "201": { description: "Suite created" },
          },
        },
        delete: {
          tags: ["Evals"],
          summary: "Delete an eval suite",
          parameters: [
            { name: "suiteId", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "Suite deleted" } },
        },
      },
      "/api/billing": {
        get: { tags: ["Billing"], summary: "Get workspace subscription and usage" },
        post: { tags: ["Billing"], summary: "Create checkout session or customer portal" },
      },
      "/api/scim/v2/Users": {
        get: {
          tags: ["SCIM"],
          summary: "List or search SCIM users",
          security: [{ ScimToken: [] }],
          parameters: [
            {
              name: "x-scim-workspace-id",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "filter",
              in: "query",
              schema: { type: "string", example: 'userName eq "alice@example.com"' },
            },
            { name: "startIndex", in: "query", schema: { type: "integer", default: 1 } },
            { name: "count", in: "query", schema: { type: "integer", default: 100 } },
          ],
          responses: { "200": { description: "SCIM ListResponse" } },
        },
        post: {
          tags: ["SCIM"],
          summary: "Provision a new user",
          security: [{ ScimToken: [] }],
          responses: {
            "201": { description: "User created" },
            "409": { description: "User already exists" },
          },
        },
      },
      "/api/scim/v2/Users/{id}": {
        get: { tags: ["SCIM"], summary: "Get a SCIM user", security: [{ ScimToken: [] }] },
        put: { tags: ["SCIM"], summary: "Replace a SCIM user", security: [{ ScimToken: [] }] },
        patch: {
          tags: ["SCIM"],
          summary: "Partially update a SCIM user",
          security: [{ ScimToken: [] }],
        },
        delete: { tags: ["SCIM"], summary: "Deprovision a user", security: [{ ScimToken: [] }] },
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      },
    },
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const spec = buildSpec(baseUrl);

  return Response.json(spec, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
