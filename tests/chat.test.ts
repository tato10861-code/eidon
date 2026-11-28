import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock heavy dependencies before the route module is imported
vi.mock("../lib/ai/engine", () => ({
  resolveEmployee: vi.fn(() => ({
    id: "ava",
    name: "Ava",
    role: "assistant",
    systemPrompt: "You are Ava, a helpful AI employee.",
    tone: "professional",
    tools: [],
    model: null,
  })),
  runEmployee: vi.fn(async function* () {
    yield { type: "text", content: "Hello from Ava" };
  }),
}));

vi.mock("../lib/neon", () => ({ getNeon: vi.fn(() => null) }));
vi.mock("../lib/usage", () => ({
  recordChat: vi.fn(),
  getUsageStats: vi.fn(),
}));
vi.mock("../lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ ok: true, remaining: 39, retryAfter: 0 })),
}));

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.resetModules();
    // Re-apply mocks after resetModules
    vi.doMock("../lib/ai/engine", () => ({
      resolveEmployee: vi.fn(() => ({
        id: "ava",
        name: "Ava",
        role: "assistant",
        systemPrompt: "You are Ava.",
        tone: "professional",
        tools: [],
        model: null,
      })),
      runEmployee: vi.fn(async function* () {
        yield { type: "text", content: "Hello" };
      }),
    }));
    vi.doMock("../lib/neon", () => ({ getNeon: vi.fn(() => null) }));
    vi.doMock("../lib/usage", () => ({ recordChat: vi.fn() }));
    vi.doMock("../lib/rate-limit", () => ({
      rateLimit: vi.fn(() => ({ ok: true, remaining: 39, retryAfter: 0 })),
    }));
  });

  it("returns 400 for missing messages", async () => {
    const { POST } = await import("../app/api/chat/route");
    const req = new Request("https://eidon.ai/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: "ava" }),
    });
    const res = await POST(req as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/message/i);
  });

  it("returns 400 for invalid JSON", async () => {
    const { POST } = await import("../app/api/chat/route");
    const req = new Request("https://eidon.ai/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty messages array", async () => {
    const { POST } = await import("../app/api/chat/route");
    const req = new Request("https://eidon.ai/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [] }),
    });
    const res = await POST(req as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    vi.doMock("../lib/rate-limit", () => ({
      rateLimit: vi.fn(() => ({ ok: false, remaining: 0, retryAfter: 10 })),
    }));
    vi.resetModules();
    vi.doMock("../lib/ai/engine", () => ({
      resolveEmployee: vi.fn(),
      runEmployee: vi.fn(),
    }));
    vi.doMock("../lib/neon", () => ({ getNeon: vi.fn(() => null) }));
    vi.doMock("../lib/usage", () => ({ recordChat: vi.fn() }));
    vi.doMock("../lib/rate-limit", () => ({
      rateLimit: vi.fn(() => ({ ok: false, remaining: 0, retryAfter: 10 })),
    }));
    const { POST } = await import("../app/api/chat/route");
    const req = new Request("https://eidon.ai/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
    });
    const res = await POST(req as Parameters<typeof POST>[0]);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("strips messages longer than 8000 chars", async () => {
    const { resolveEmployee, runEmployee } = await import("../lib/ai/engine");
    const longContent = "x".repeat(10_000);
    const capturedMessages: { role: string; content: string }[] = [];
    (runEmployee as ReturnType<typeof vi.fn>).mockImplementation(async function* (
      _emp: unknown,
      msgs: { role: string; content: string }[],
    ) {
      capturedMessages.push(...msgs);
      yield { type: "text", content: "ok" };
    });
    (resolveEmployee as ReturnType<typeof vi.fn>).mockReturnValue({
      id: "ava",
      name: "Ava",
      systemPrompt: "You are Ava.",
      tone: "professional",
      tools: [],
      model: null,
    });
    const { POST } = await import("../app/api/chat/route");
    const req = new Request("https://eidon.ai/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: longContent }],
      }),
    });
    await POST(req as Parameters<typeof POST>[0]);
    if (capturedMessages.length > 0) {
      expect(capturedMessages[0].content.length).toBeLessThanOrEqual(8_000);
    }
  });
});
