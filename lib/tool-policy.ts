import { getProvider } from "@/lib/oauth";

const TOOL_ALIASES: Record<string, string> = {
  hubspot: "hubspot",
  slack: "slack",
  github: "github",
  google: "google",
  "google workspace": "google",
};

const ACTIONS: Record<string, Set<string>> = {
  hubspot: new Set(["contacts.read", "contacts.write", "deals.read"]),
  slack: new Set(["channels.read", "messages.send", "users.read"]),
  github: new Set(["repos.read", "pull_requests.write"]),
  google: new Set(["calendar.read", "calendar.write", "gmail.read"]),
};

export type ToolPolicyDecision =
  | { allowed: true; provider: string; action: string }
  | { allowed: false; code: "unknown_tool" | "unknown_action" | "invalid_params"; reason: string };

export function evaluateToolPolicy(
  tool: string,
  action: string,
  params: Record<string, unknown> | undefined,
): ToolPolicyDecision {
  const provider = TOOL_ALIASES[tool.trim().toLowerCase()];
  if (!provider || !getProvider(provider)) {
    return {
      allowed: false,
      code: "unknown_tool",
      reason: "Tool is not in the provider allowlist.",
    };
  }
  const normalizedAction = action.trim().toLowerCase();
  if (!ACTIONS[provider]?.has(normalizedAction)) {
    return {
      allowed: false,
      code: "unknown_action",
      reason: "Action is not in the provider allowlist.",
    };
  }
  if (params !== undefined && (typeof params !== "object" || Array.isArray(params))) {
    return {
      allowed: false,
      code: "invalid_params",
      reason: "Tool parameters must be a JSON object.",
    };
  }
  return { allowed: true, provider, action: normalizedAction };
}

export function isApprovalRequired(action: string) {
  return new Set(["contacts.write", "messages.send", "calendar.write", "pull_requests.write"]).has(
    action,
  );
}
