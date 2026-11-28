import { describe, it, expect, vi } from "vitest";

vi.mock("../lib/neon", () => ({ getNeon: vi.fn(() => null) }));

describe("GET /api/billing/status", () => {
  it("returns 400 without workspaceId", async () => {
    const { GET } = await import("../app/api/billing/status/route");
    const req = new Request("https://eidon.ai/api/billing/status");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/workspaceId/i);
  });

  it("returns starter plan defaults when db is not configured", async () => {
    const { GET } = await import("../app/api/billing/status/route");
    const req = new Request("https://eidon.ai/api/billing/status?workspaceId=ws_123");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan).toBe("starter");
    expect(body.conversationsLimit).toBe(250);
    expect(body.status).toBe("active");
  });

  it("includes all required fields in the offline response", async () => {
    const { GET } = await import("../app/api/billing/status/route");
    const req = new Request("https://eidon.ai/api/billing/status?workspaceId=ws_abc");
    const res = await GET(req);
    const body = await res.json();
    const required = [
      "plan",
      "planName",
      "status",
      "conversationsUsed",
      "conversationsLimit",
      "billingPeriodEnd",
      "seats",
    ];
    for (const key of required) {
      expect(body).toHaveProperty(key);
    }
  });
});
