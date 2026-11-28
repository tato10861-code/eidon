import { describe, it, expect, vi } from "vitest";

vi.mock("../lib/neon", () => ({
  getNeon: vi.fn(() => null),
}));
vi.mock("../lib/usage", () => ({
  getGlobalStats: vi.fn(() => ({ totalTokens: 0, totalChats: 0 })),
}));

describe("admin stats API", () => {
  it("returns 401 when ADMIN_API_KEY is not configured", async () => {
    delete process.env.ADMIN_API_KEY;
    const { GET } = await import("../app/api/admin/stats/route");
    const request = new Request("https://eidon.ai/api/admin/stats", {
      headers: { "x-admin-key": "any" },
    });
    const response = await GET(request as Parameters<typeof GET>[0]);
    expect(response.status).toBe(401);
  });

  it("returns 401 with wrong admin key", async () => {
    process.env.ADMIN_API_KEY = "correct_key_abc123";
    const { GET } = await import("../app/api/admin/stats/route");
    const request = new Request("https://eidon.ai/api/admin/stats", {
      headers: { "x-admin-key": "wrong_key" },
    });
    const response = await GET(request as Parameters<typeof GET>[0]);
    expect(response.status).toBe(401);
  });

  it("returns 200 with correct admin key (offline mode)", async () => {
    process.env.ADMIN_API_KEY = "test_admin_key_xyz";
    vi.resetModules();
    vi.doMock("../lib/neon", () => ({ getNeon: vi.fn(() => null) }));
    vi.doMock("../lib/usage", () => ({
      getGlobalStats: vi.fn(() => ({ totalTokens: 1000, totalChats: 5 })),
    }));
    const { GET } = await import("../app/api/admin/stats/route");
    const request = new Request("https://eidon.ai/api/admin/stats", {
      headers: { "x-admin-key": "test_admin_key_xyz" },
    });
    const response = await GET(request as Parameters<typeof GET>[0]);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("uptime");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("runtime");
  });

  it("admin workspaces returns 401 without key", async () => {
    delete process.env.ADMIN_API_KEY;
    const { GET } = await import("../app/api/admin/workspaces/route");
    const request = new Request("https://eidon.ai/api/admin/workspaces");
    const response = await GET(request as Parameters<typeof GET>[0]);
    expect(response.status).toBe(401);
  });

  it("admin workspaces returns 503 when db not configured", async () => {
    process.env.ADMIN_API_KEY = "test_admin_key_xyz";
    vi.resetModules();
    vi.doMock("../lib/neon", () => ({ getNeon: vi.fn(() => null) }));
    const { GET } = await import("../app/api/admin/workspaces/route");
    const request = new Request("https://eidon.ai/api/admin/workspaces", {
      headers: { "x-admin-key": "test_admin_key_xyz" },
    });
    const response = await GET(request as Parameters<typeof GET>[0]);
    expect(response.status).toBe(503);
  });
});
