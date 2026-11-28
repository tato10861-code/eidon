export type PlanId = "starter" | "scale" | "enterprise";
export type BillableMetric = "conversationTurns" | "chatTokens" | "exportJobs" | "apiCalls";

export interface PlanLimits {
  workspaces: number | null;
  members: number | null;
  employees: number | null;
  conversationTurns: number | null;
  chatTokens: number | null;
  exportJobs: number | null;
  apiCalls: number | null;
  sso: boolean;
  privateDeployment: boolean;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  starter: {
    workspaces: 5,
    members: 5,
    employees: 3,
    conversationTurns: 1_000,
    chatTokens: 250_000,
    exportJobs: 10,
    apiCalls: 10_000,
    sso: false,
    privateDeployment: false,
  },
  scale: {
    workspaces: 50,
    members: 100,
    employees: 25,
    conversationTurns: 25_000,
    chatTokens: 10_000_000,
    exportJobs: 250,
    apiCalls: 250_000,
    sso: true,
    privateDeployment: true,
  },
  enterprise: {
    workspaces: null,
    members: null,
    employees: null,
    conversationTurns: null,
    chatTokens: null,
    exportJobs: null,
    apiCalls: null,
    sso: true,
    privateDeployment: true,
  },
};

export function normalizePlan(value: unknown): PlanId {
  return value === "scale" || value === "enterprise" ? value : "starter";
}
