/**
 * Feature flag system — workspace-scoped and global flags.
 *
 * Flags are stored in workspaces.settings.featureFlags (jsonb).
 * Falls back to environment variables for global defaults.
 *
 * Usage:
 *   const flags = await getWorkspaceFlags(workspaceId);
 *   if (flags.advancedEvals) { ... }
 *
 * Adding a new flag:
 *   1. Add to DEFAULT_FLAGS below.
 *   2. Set per-workspace via PATCH /api/workspaces/settings.
 */

import { getNeon } from "./neon";

export interface FeatureFlags {
  /** Enable the AI evals framework for this workspace. */
  advancedEvals: boolean;
  /** Enable multi-model routing (allow employees to specify different models). */
  multiModelRouting: boolean;
  /** Enable streaming responses by default. */
  streamingDefault: boolean;
  /** Enable conversation memory across sessions. */
  persistentMemory: boolean;
  /** Enable function/tool calling for AI employees. */
  toolCalling: boolean;
  /** Enable fine-tuning job submissions. */
  fineTuning: boolean;
  /** Enable real-time collaboration on conversations. */
  realtimeCollaboration: boolean;
  /** Enable data retention policies. */
  dataRetention: boolean;
  /** Show cost estimates in the workspace dashboard. */
  costEstimation: boolean;
  /** Enable webhook delivery tracking UI. */
  webhookDeliveryLogs: boolean;
}

export const DEFAULT_FLAGS: FeatureFlags = {
  advancedEvals: Boolean(process.env.FF_ADVANCED_EVALS),
  multiModelRouting: true,
  streamingDefault: true,
  persistentMemory: Boolean(process.env.FF_PERSISTENT_MEMORY),
  toolCalling: true,
  fineTuning: Boolean(process.env.FF_FINE_TUNING),
  realtimeCollaboration: Boolean(process.env.FF_REALTIME),
  dataRetention: true,
  costEstimation: true,
  webhookDeliveryLogs: true,
};

/** Retrieve feature flags for a workspace, merged with defaults. */
export async function getWorkspaceFlags(workspaceId: string): Promise<FeatureFlags> {
  const neon = getNeon();
  if (!neon) return { ...DEFAULT_FLAGS };

  type Row = { settings: unknown };
  const rows = (await neon`
    SELECT settings FROM workspaces WHERE id = ${workspaceId} LIMIT 1
  `) as unknown as Row[];

  if (!rows.length) return { ...DEFAULT_FLAGS };

  const settings = (rows[0].settings as Record<string, unknown>) ?? {};
  const flags = (settings.featureFlags as Partial<FeatureFlags>) ?? {};

  return { ...DEFAULT_FLAGS, ...flags };
}

/** Check a single flag. */
export async function isEnabled(workspaceId: string, flag: keyof FeatureFlags): Promise<boolean> {
  const flags = await getWorkspaceFlags(workspaceId);
  return flags[flag];
}

/** Set multiple flags on a workspace (upsert-style). */
export async function setWorkspaceFlags(
  workspaceId: string,
  overrides: Partial<FeatureFlags>,
): Promise<void> {
  const neon = getNeon();
  if (!neon) return;

  await neon`
    UPDATE workspaces
    SET settings = COALESCE(settings, '{}'::jsonb) ||
                   jsonb_build_object('featureFlags',
                     COALESCE(settings->'featureFlags', '{}'::jsonb) || ${JSON.stringify(overrides)}::jsonb),
        updated_at = ${new Date().toISOString()}
    WHERE id = ${workspaceId}
  `;
}
