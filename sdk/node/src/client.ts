import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  EidonClientOptions,
  Employee,
  StreamChunk,
} from "./types.js";

const VERSION = "0.2.0";

export class EidonClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  readonly defaultEmployeeId?: string;

  constructor(options: EidonClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://eidon.ai").replace(/\/$/, "");
    this.timeout = options.timeout ?? 30_000;
    this.defaultEmployeeId = options.defaultEmployeeId;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": `eidon-node/${VERSION}`,
    };
  }

  private async fetch(path: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: { ...this.headers(), ...((init.headers as Record<string, string>) ?? {}) },
        signal: controller.signal,
      });
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  async listEmployees(): Promise<Employee[]> {
    const res = await this.fetch("/api/employees", { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { employees: Employee[] };
    return data.employees ?? [];
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const chunks: string[] = [];
    let model = "unknown";
    let tokens = 0;
    let latencyMs = 0;

    for await (const chunk of this.stream(messages, options)) {
      if (chunk.type === "delta" && chunk.text) chunks.push(chunk.text);
      if (chunk.type === "meta" && chunk.model) model = chunk.model;
      if (chunk.type === "done" && chunk.usage) {
        tokens = chunk.usage.tokens;
        latencyMs = chunk.usage.latencyMs;
      }
    }

    return {
      employeeId: options.employeeId ?? this.defaultEmployeeId ?? "default",
      model,
      text: chunks.join(""),
      tokens,
      latencyMs,
      messages: [...messages, { role: "assistant", content: chunks.join("") }],
    };
  }

  async *stream(messages: ChatMessage[], options: ChatOptions = {}): AsyncGenerator<StreamChunk> {
    const body = {
      employeeId: options.employeeId ?? this.defaultEmployeeId,
      workspaceId: options.workspaceId,
      conversationId: options.conversationId,
      messages,
    };

    const res = await this.fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      yield { type: "error", error: `HTTP ${res.status}: ${await res.text()}` };
      return;
    }

    if (!res.body) {
      yield { type: "error", error: "No response body" };
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          yield JSON.parse(raw) as StreamChunk;
        } catch {
          // skip malformed SSE lines
        }
      }
    }
  }
}
