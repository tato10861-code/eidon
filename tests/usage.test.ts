import { describe, it, expect, beforeEach } from "vitest";
import { recordApiCall, recordChat, recordExport, getUsage, getUsageSummary } from "../lib/usage";

describe("usage accounting", () => {
  const ws = `test-ws-${Date.now()}`;

  it("starts at zero for a new workspace", () => {
    const rec = getUsage(ws);
    expect(rec.apiCalls).toBe(0);
    expect(rec.chatTokens).toBe(0);
    expect(rec.conversationTurns).toBe(0);
    expect(rec.exportJobs).toBe(0);
  });

  it("increments apiCalls", () => {
    recordApiCall(ws);
    recordApiCall(ws);
    expect(getUsage(ws).apiCalls).toBe(2);
  });

  it("increments chatTokens and conversationTurns", () => {
    recordChat(ws, 100, "ava");
    recordChat(ws, 250, "ava");
    recordChat(ws, 180, "dani");
    const rec = getUsage(ws);
    expect(rec.chatTokens).toBe(530);
    expect(rec.conversationTurns).toBe(3);
  });

  it("tracks per-employee runs", () => {
    const rec = getUsage(ws);
    expect(rec.employeeRuns["ava"]).toBe(2);
    expect(rec.employeeRuns["dani"]).toBe(1);
  });

  it("increments exportJobs", () => {
    recordExport(ws);
    expect(getUsage(ws).exportJobs).toBe(1);
  });

  it("summary includes topEmployee", () => {
    const summary = getUsageSummary(ws);
    expect(summary.topEmployee?.id).toBe("ava");
    expect(summary.topEmployee?.runs).toBe(2);
  });

  it("summary includes month string", () => {
    const summary = getUsageSummary(ws);
    expect(summary.month).toMatch(/^\d{4}-\d{2}$/);
  });
});
