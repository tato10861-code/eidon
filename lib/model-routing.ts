/**
 * Multi-model routing — per-employee and per-workspace model configuration.
 *
 * Enterprise buyers need to:
 *   - Pin specific employees to approved models (data governance)
 *   - Set cost caps per tier (free: haiku, pro: sonnet, enterprise: opus)
 *   - Override routing dynamically per conversation context
 *
 * Resolution order (highest to lowest priority):
 *   1. Per-conversation override (body.model)
 *   2. Per-employee model (employees.model)
 *   3. Workspace default model (workspaces.settings.defaultModel)
 *   4. Tier default (plan-based)
 *   5. Global fallback (NEXT_PUBLIC_DEFAULT_MODEL env var)
 */

export type ModelTier = "free" | "starter" | "pro" | "enterprise";

export interface ModelRoutingConfig {
  employeeModel?: string | null;
  workspaceDefaultModel?: string | null;
  workspacePlan?: string | null;
  conversationOverride?: string | null;
}

/** Canonical model IDs we support. */
export const SUPPORTED_MODELS = [
  // Anthropic
  "claude-opus-4-5",
  "claude-sonnet-4-5",
  "claude-haiku-4-5",
  "claude-sonnet-4-6",
  // OpenRouter passthrough
  "openrouter/auto",
  // Google
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  // Mistral
  "mistral-large-latest",
  "mistral-small-latest",
  // Cohere
  "command-r-plus",
  "command-r",
  // xAI
  "grok-2-latest",
  // OpenAI
  "gpt-4o",
  "gpt-4o-mini",
] as const;

/** Default model per plan tier. */
const TIER_DEFAULTS: Record<ModelTier, string> = {
  free: "claude-haiku-4-5",
  starter: "claude-haiku-4-5",
  pro: "claude-sonnet-4-6",
  enterprise: "claude-sonnet-4-6",
};

/** Resolve the best model for a request given the routing config. */
export function resolveModel(config: ModelRoutingConfig): string {
  // 1. Explicit per-conversation override
  if (config.conversationOverride) return config.conversationOverride;

  // 2. Per-employee pinned model
  if (config.employeeModel) return config.employeeModel;

  // 3. Workspace default
  if (config.workspaceDefaultModel) return config.workspaceDefaultModel;

  // 4. Tier default
  const plan = (config.workspacePlan ?? "pro") as ModelTier;
  if (plan in TIER_DEFAULTS) return TIER_DEFAULTS[plan];

  // 5. Global env fallback
  return process.env.NEXT_PUBLIC_DEFAULT_MODEL ?? "claude-sonnet-4-6";
}

/** Validate that a model ID is in the supported list. */
export function isValidModel(model: string): boolean {
  return (SUPPORTED_MODELS as readonly string[]).includes(model);
}

/** Return all models accessible for a given plan. */
export function modelsForPlan(plan: ModelTier): string[] {
  // Free/starter: cost-efficient models only
  if (plan === "free" || plan === "starter") {
    return SUPPORTED_MODELS.filter(
      (m) =>
        m.includes("haiku") ||
        m.includes("flash") ||
        m.includes("mini") ||
        m.includes("small") ||
        (m.includes("command-r") && !m.includes("plus")),
    );
  }
  // Pro/enterprise: all models
  return [...SUPPORTED_MODELS];
}
