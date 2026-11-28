import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { issueApprovalToken, consumeApprovalToken, ApprovalDenied } from "../lib/approvals";
import { verifyStripeSignature } from "../lib/billing/stripe";
import { validateWebhookTarget } from "../lib/webhooks";
import {
  createCodeChallenge,
  createCodeVerifier,
  createOAuthState,
  verifyOAuthState,
} from "../lib/oauth";

describe("security hardening", () => {
  it("issues an approval token that can only be consumed once", async () => {
    const input = {
      workspaceId: "demo",
      actor: "demo",
      tool: "crm",
      action: "update",
      params: { id: "1", status: "approved" },
    };
    const issued = await issueApprovalToken(input);
    await expect(consumeApprovalToken({ ...input, token: issued.token })).resolves.toMatchObject({
      actor: "demo",
    });
    await expect(consumeApprovalToken({ ...input, token: issued.token })).rejects.toBeInstanceOf(
      ApprovalDenied,
    );
  });

  it("rejects approval tokens bound to different parameters", async () => {
    const input = {
      workspaceId: "demo",
      actor: "demo",
      tool: "crm",
      action: "update",
      params: { id: "1" },
    };
    const issued = await issueApprovalToken(input);
    await expect(
      consumeApprovalToken({ ...input, params: { id: "2" }, token: issued.token }),
    ).rejects.toBeInstanceOf(ApprovalDenied);
  });

  it("verifies Stripe signatures and rejects stale timestamps", () => {
    const body = JSON.stringify({ id: "evt_test", type: "invoice.paid" });
    const secret = "whsec_test";
    const timestamp = Math.floor(Date.now() / 1000);
    const signed = `${timestamp}.${body}`;
    const digest = crypto.createHmac("sha256", secret).update(signed).digest("hex");
    expect(verifyStripeSignature(body, `t=${timestamp},v1=${digest}`, secret)).toBe(true);
    expect(verifyStripeSignature(body, `t=${timestamp - 1000},v1=${digest}`, secret)).toBe(false);
  });

  it("rejects loopback webhook targets", async () => {
    await expect(validateWebhookTarget("https://127.0.0.1/hook")).rejects.toThrow();
    await expect(validateWebhookTarget("https://[::ffff:127.0.0.1]/hook")).rejects.toThrow();
    await expect(validateWebhookTarget("https://[::1]/hook")).rejects.toThrow();
  });

  it("creates an S256 PKCE pair and rejects OAuth state without a secret", () => {
    const verifier = createCodeVerifier();
    expect(createCodeChallenge(verifier)).toHaveLength(43);
    const previous = process.env.EIDON_OAUTH_STATE_SECRET;
    delete process.env.EIDON_OAUTH_STATE_SECRET;
    expect(createOAuthState("github", "workspace")).toBeNull();
    expect(verifyOAuthState("invalid", "github", "workspace")).toBe(false);
    if (previous === undefined) delete process.env.EIDON_OAUTH_STATE_SECRET;
    else process.env.EIDON_OAUTH_STATE_SECRET = previous;
  });

  it("binds OAuth state to provider and workspace", () => {
    const previous = process.env.EIDON_OAUTH_STATE_SECRET;
    process.env.EIDON_OAUTH_STATE_SECRET = "test-oauth-secret-with-sufficient-entropy";
    const state = createOAuthState("github", "workspace");
    expect(state).toBeTruthy();
    expect(verifyOAuthState(state, "github", "workspace")).toBe(true);
    expect(verifyOAuthState(state, "slack", "workspace")).toBe(false);
    expect(verifyOAuthState(state, "github", "other-workspace")).toBe(false);
    if (previous === undefined) delete process.env.EIDON_OAUTH_STATE_SECRET;
    else process.env.EIDON_OAUTH_STATE_SECRET = previous;
  });
});
