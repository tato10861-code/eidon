export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  description?: string;
}

export interface ChatResponse {
  employeeId: string;
  model: string;
  text: string;
  tokens: number;
  latencyMs: number;
  messages: ChatMessage[];
}

export interface StreamChunk {
  type: "meta" | "delta" | "done" | "error";
  text?: string;
  model?: string;
  usage?: { tokens: number; latencyMs: number };
  error?: string;
}

export interface EidonClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  defaultEmployeeId?: string;
}

export interface ChatOptions {
  employeeId?: string;
  workspaceId?: string;
  conversationId?: string;
  stream?: boolean;
}
