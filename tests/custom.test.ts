import { describe, expect, it } from "vitest";
import { buildCustomEmployee, readinessScore, roleLabels } from "@/lib/custom";
import type { EmployeeConfig } from "@/lib/types";

const baseConfig: EmployeeConfig = {
  name: "Test Bot",
  role: "sales",
  company: "Acme",
  tone: "precise",
  language: "English",
  mission: "Book qualified meetings with engineering leaders.",
  skills: ["Research"],
  tools: ["HubSpot"],
  knowledge: ["ICP is mid-market SaaS."],
  guardrails: ["Never invent pricing."],
  channels: ["Web"],
  creativity: 30,
  autonomy: 50,
  escalation: "Escalate pricing questions.",
};

describe("custom builder", () => {
  it("builds an employee template from config", () => {
    const employee = buildCustomEmployee(baseConfig);
    expect(employee.id).toBe("custom");
    expect(employee.slug).toBe("custom");
    expect(employee.name).toBe("Test Bot");
    expect(employee.role).toBe("sales");
    expect(employee.skills).toEqual(["Research"]);
    expect(employee.tools[0].name).toBe("HubSpot");
  });

  it("falls back to base profile skills when none provided", () => {
    const employee = buildCustomEmployee({ ...baseConfig, skills: [], tools: [] });
    expect(employee.skills.length).toBeGreaterThan(0);
    expect(employee.tools.length).toBeGreaterThan(0);
  });

  it("readiness score stays within bounds", () => {
    expect(readinessScore(baseConfig)).toBeGreaterThanOrEqual(0);
    expect(readinessScore(baseConfig)).toBeLessThanOrEqual(99);
  });

  it("readiness score increases with more content", () => {
    const richer = {
      ...baseConfig,
      mission: "Book qualified meetings with engineering leaders at scale.",
      skills: ["Research", "Outbound", "Qualification"],
      tools: ["HubSpot", "Gmail", "Slack"],
      knowledge: ["a", "b", "c"],
      guardrails: ["Never invent pricing.", "Escalate PII."],
    };
    expect(readinessScore(richer)).toBeGreaterThan(readinessScore(baseConfig));
  });

  it("role labels cover every role", () => {
    expect(Object.keys(roleLabels).length).toBe(12);
  });
});
