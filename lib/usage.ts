/**
 * In-memory usage accounting for the demo tier.
 * Production deployments replace this with a Neon / Supabase counter table.
 *
 * Tracks: API calls, chat tokens, conversation turns and export jobs per
 * workspace so the billing dashboard and rate-limiter can read live numbers.
 */

export interface UsageRecord {
  workspaceId: string;
  periodStart: number;
  apiCalls: number;
  chatTokens: number;
  conversationTurns: number;
  exportJobs: number;
  employeeRuns: Record<string, number>;
}

const store = new Map<string, UsageRecord>();

function key(workspaceId: string, month: string) {
  return `${workspaceId}:${month}`;
}

function currentMonth() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getOrCreate(workspaceId: string): UsageRecord {
  const k = key(workspaceId, currentMonth());
  if (!store.has(k)) {
    store.set(k, {
      workspaceId,
      periodStart: Date.now(),
      apiCalls: 0,
      chatTokens: 0,
      conversationTurns: 0,
      exportJobs: 0,
      employeeRuns: {},
    });
  }
  return store.get(k)!;
}

export function recordApiCall(workspaceId: string) {
  getOrCreate(workspaceId).apiCalls++;
}

export function recordChat(workspaceId: string, tokens: number, employeeId: string) {
  const rec = getOrCreate(workspaceId);
  rec.chatTokens += tokens;
  rec.conversationTurns++;
  rec.employeeRuns[employeeId] = (rec.employeeRuns[employeeId] ?? 0) + 1;
}

export function recordExport(workspaceId: string) {
  getOrCreate(workspaceId).exportJobs++;
}

export function getUsage(workspaceId: string): UsageRecord {
  return getOrCreate(workspaceId);
}

export function getUsageSummary(workspaceId: string) {
  const rec = getUsage(workspaceId);
  const topEmployee = Object.entries(rec.employeeRuns).sort(([, a], [, b]) => b - a)[0];
  return {
    ...rec,
    topEmployee: topEmployee ? { id: topEmployee[0], runs: topEmployee[1] } : null,
    month: currentMonth(),
  };
}
