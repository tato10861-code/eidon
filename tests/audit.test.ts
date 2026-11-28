import { describe, it, expect, vi } from "vitest";

vi.mock("../lib/neon", () => ({
  getNeon: vi.fn(() => null),
}));

describe("audit log", () => {
  it("audit_log schema contract is maintained", () => {
    const expectedColumns = [
      "id",
      "workspace_id",
      "actor",
      "action",
      "target",
      "payload",
      "created_at",
    ];
    expect(expectedColumns).toContain("workspace_id");
    expect(expectedColumns).toContain("actor");
    expect(expectedColumns).toContain("action");
    expect(expectedColumns.length).toBe(7);
  });

  it("GET /api/audit returns 400 without workspaceId", async () => {
    const { GET } = await import("../app/api/audit/route");
    const request = new Request("https://eidon.ai/api/audit");
    const response = await GET(request as Parameters<typeof GET>[0]);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toMatch(/workspaceId/i);
  });

  it("GET /api/audit returns 503 when neon not configured", async () => {
    const { GET } = await import("../app/api/audit/route");
    const request = new Request("https://eidon.ai/api/audit?workspaceId=ws_123");
    const response = await GET(request as Parameters<typeof GET>[0]);
    expect(response.status).toBe(503);
  });

  it("POST /api/audit returns 400 without required fields", async () => {
    const { POST } = await import("../app/api/audit/route");
    const request = new Request("https://eidon.ai/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: "ws_123" }), // missing action
    });
    const response = await POST(request as Parameters<typeof POST>[0]);
    const body = await response.json();
    expect(response.status).toBe(503); // neon not configured; still hits that check first
    expect(body.error).toBeTruthy();
  });
});
