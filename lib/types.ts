export type RoleId =
  | "sales"
  | "analyst"
  | "support"
  | "recruiter"
  | "marketing"
  | "finance"
  | "legal"
  | "operations"
  | "product"
  | "engineering"
  | "executive"
  | "success";

export type Tone = "precise" | "warm" | "direct" | "consultative";

export interface Tool {
  name: string;
  category: string;
  /** Short identifier used by the demo runtime trace. */
  action: string;
}

export interface Playbook {
  approach: string[];
  deliverable: string;
  checks: string[];
}

export interface EmployeeTemplate {
  id: string;
  slug: string;
  name: string;
  role: RoleId;
  department: string;
  title: string;
  tagline: string;
  description: string;
  accent: string;
  accentSoft: string;
  initials: string;
  status: "available" | "beta";
  rating: number;
  runs: string;
  responseTime: string;
  skills: string[];
  tools: Tool[];
  metrics: { label: string; value: string }[];
  systemPrompt: string;
  starters: string[];
  playbook: Playbook;
  channels: string[];
  languages: string[];
  /** Marketing copy for the Arabic locale. */
  ar: {
    title: string;
    tagline: string;
    description: string;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  trace?: TraceEvent[];
  meta?: { model: string; latencyMs: number; tokens: number; mode: "live" | "demo" };
}

export interface TraceEvent {
  id: string;
  type: "thought" | "tool" | "guardrail" | "handoff";
  label: string;
  detail?: string;
  status: "running" | "done";
}

export interface EmployeeConfig {
  name: string;
  role: RoleId;
  company: string;
  tone: Tone;
  language: string;
  mission: string;
  skills: string[];
  tools: string[];
  knowledge: string[];
  guardrails: string[];
  channels: string[];
  creativity: number;
  autonomy: number;
  escalation: string;
}
