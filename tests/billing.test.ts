import { describe, expect, it } from "vitest";
import { assertEntitled, EntitlementDenied } from "../lib/billing/entitlements";
import { normalizePlan, PLAN_LIMITS } from "../lib/billing/plans";
import { recordChat } from "../lib/usage";

describe("billing plans", () => {
  it("normalizes unknown plans to starter", () => {
    expect(normalizePlan("scale")).toBe("scale");
    expect(normalizePlan("enterprise")).toBe("enterprise");
    expect(normalizePlan("unknown")).toBe("starter");
    expect(normalizePlan(undefined)).toBe("starter");
  });

  it("keeps enterprise usage unlimited", () => {
    expect(PLAN_LIMITS.enterprise.conversationTurns).toBeNull();
    expect(PLAN_LIMITS.enterprise.chatTokens).toBeNull();
  });

  it("enforces the starter conversation limit in demo mode", async () => {
    const workspaceId = `billing-${Date.now()}-${Math.random()}`;
    for (let i = 0; i < PLAN_LIMITS.starter.conversationTurns!; i++) {
      recordChat(workspaceId, 0, "ava");
    }

    await expect(assertEntitled(workspaceId, "conversationTurns", 1)).rejects.toBeInstanceOf(
      EntitlementDenied,
    );
  });

  it("allows usage below the starter limit", async () => {
    const workspaceId = `billing-under-${Date.now()}-${Math.random()}`;
    recordChat(workspaceId, 0, "ava");
    await expect(assertEntitled(workspaceId, "conversationTurns", 1)).resolves.toMatchObject({
      plan: "starter",
      current: 1,
      limit: 1_000,
    });
  });
});
