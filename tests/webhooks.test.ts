import { describe, it, expect } from "vitest";
import { verifyWebhookSignature } from "../lib/webhooks";
import crypto from "node:crypto";

function sign(secret: string, body: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyWebhookSignature", () => {
  const secret = "test_webhook_secret_32bytes_abcde";
  const payload = JSON.stringify({ event: "conversation.created", data: { id: "c_123" } });

  it("returns true for a valid signature", () => {
    const sig = sign(secret, payload);
    expect(verifyWebhookSignature(payload, sig, secret)).toBe(true);
  });

  it("returns false for wrong secret", () => {
    const sig = sign("wrong_secret_here_32bytes_xxxxxxx", payload);
    expect(verifyWebhookSignature(payload, sig, secret)).toBe(false);
  });

  it("returns false for tampered payload", () => {
    const sig = sign(secret, payload);
    const tampered = payload.replace("c_123", "c_456");
    expect(verifyWebhookSignature(tampered, sig, secret)).toBe(false);
  });

  it("returns false for wrong hash algorithm prefix", () => {
    const correctHex = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    // Provide valid hex but wrong prefix
    expect(verifyWebhookSignature(payload, `sha1=${correctHex}`, secret)).toBe(false);
  });

  it("returns false for empty signature", () => {
    expect(verifyWebhookSignature(payload, "", secret)).toBe(false);
  });

  it("returns false for hex string of wrong length", () => {
    expect(verifyWebhookSignature(payload, "sha256=abc123", secret)).toBe(false);
  });
});
