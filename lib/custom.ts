import { employees } from "./employees";
import type { EmployeeConfig, EmployeeTemplate, RoleId } from "./types";
import { initials } from "./utils";

export const roleLabels: Record<RoleId, string> = {
  sales: "Sales",
  analyst: "Data",
  support: "Support",
  recruiter: "Recruiting",
  marketing: "Marketing",
  finance: "Finance",
  legal: "Legal",
  operations: "Operations",
  product: "Product",
  engineering: "Engineering",
  executive: "Executive",
  success: "Customer Success",
};

export const toneLabels = {
  precise: "Precise",
  warm: "Warm",
  direct: "Direct",
  consultative: "Consultative",
} as const;

export const channelOptions = ["Web", "Email", "Slack", "WhatsApp", "API"] as const;

export const guardrailPresets = [
  "Never invent pricing, discounts or contractual terms.",
  "Never provide legal, tax or investment advice.",
  "Escalate any request involving PII, security or a data breach.",
  "Require human approval before refunds above $500.",
  "Never claim a capability the product does not have.",
  "Refuse to impersonate a human when asked directly.",
] as const;

export function buildCustomEmployee(config: EmployeeConfig): EmployeeTemplate {
  const base = employees.find((employee) => employee.role === config.role) ?? employees[0];

  return {
    ...base,
    id: "custom",
    slug: "custom",
    name: config.name.trim() || "Your employee",
    title: roleLabels[config.role] ?? base.title,
    tagline:
      config.mission.trim().slice(0, 130) ||
      `A custom ${roleLabels[config.role]?.toLowerCase() ?? "AI"} employee.`,
    description: config.mission.trim() || base.description,
    initials: initials(config.name.trim() || "AI") || "AI",
    skills: config.skills.length ? config.skills : base.skills,
    tools: config.tools.length
      ? config.tools.map((name) => ({
          name,
          category: "Connected",
          action: `${name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}.run`,
        }))
      : base.tools,
    starters: [
      `Walk me through how you would handle your first week as a ${roleLabels[config.role]?.toLowerCase() ?? "specialist"}.`,
      "What can you do, and where do you escalate to a human?",
      config.mission.trim() || base.starters[0],
    ],
    channels: config.channels.length ? config.channels : base.channels,
    systemPrompt: `${base.systemPrompt}\n\nCompany: ${config.company || "the company"}. Mission: ${config.mission || base.tagline}`,
  };
}

export function readinessScore(config: EmployeeConfig) {
  let score = 38;
  if (config.name.trim()) score += 5;
  if (config.company.trim()) score += 4;
  if (config.mission.trim().length > 30) score += 10;
  score += Math.min(12, config.skills.length * 2);
  score += Math.min(12, config.tools.length * 2);
  score += Math.min(9, config.knowledge.filter((item) => item.trim()).length * 3);
  score += Math.min(9, config.guardrails.filter((item) => item.trim()).length * 2);
  score += Math.min(5, config.channels.length);
  return Math.min(99, score);
}
