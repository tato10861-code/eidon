import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EidonClient } from "../src/client.js";
import type { ChatMessage } from "../src/types.js";

const BASE = "https://eidon.test";
const KEY = "ek_test_node_key";

function sseBody(...events: object[]): ReadableStream {
  const lines = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(lines));
      controller.close();
    },
  });
}

describe("EidonClient", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stream() yields delta chunks", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      body: sseBody(
        { type: "meta", model: "test-model", mode: "live" },
        { type: "delta", text: "Hello" },
        { type: "delta", text: " Node" },
        { type: "done", usage: { tokens: 10, latencyMs: 200 } },
      ),
    });

    const client = new EidonClient({ apiKey: KEY, baseUrl: BASE });
    const messages: ChatMessage[] = [{ role: "user", content: "hi" }];
    const chunks: string[] = [];
    for await (const c of client.stream(messages)) {
      if (c.type === "delta" && c.text) chunks.push(c.text);
    }
    expect(chunks).toEqual(["Hello", " Node"]);
  });

  it("chat() assembles full text", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      body: sseBody(
        { type: "delta", text: "Hi" },
        { type: "delta", text: "!" },
        { type: "done", usage: { tokens: 3, latencyMs: 50 } },
      ),
    });

    const client = new EidonClient({ apiKey: KEY, baseUrl: BASE });
    const resp = await client.chat([{ role: "user", content: "hey" }]);
    expect(resp.text).toBe("Hi!");
  });

  it("listEmployees() returns array", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        employees: [{ id: "ava", name: "Ava", role: "Assistant" }],
      }),
    });

    const client = new EidonClient({ apiKey: KEY, baseUrl: BASE });
    const list = await client.listEmployees();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("ava");
  });

  it("stream() yields error chunk on non-ok response", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Too Many Requests",
    });

    const client = new EidonClient({ apiKey: KEY, baseUrl: BASE });
    const chunks = [];
    for await (const c of client.stream([{ role: "user", content: "hi" }])) {
      chunks.push(c);
    }
    expect(chunks[0].type).toBe("error");
  });
});
