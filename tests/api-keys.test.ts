import { describe, it, expect } from "vitest";
import {
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  extractPrefix,
  extractBearerKey,
  hasScope,
  type ApiKey,
} from "../lib/api-keys";

describe("generateApiKey", () => {
  it("produces a key starting with ek_", async () => {
    const { key } = await generateApiKey("ws-test");
    expect(key).toMatch(/^ek_/);
  });

  it("prefix matches workspaceId first 6 chars", async () => {
    const { key, prefix } = await generateApiKey("abcdef");
    expect(prefix).toBe("abcdef");
    expect(key).toContain(`ek_abcdef_`);
  });

  it("two calls produce different keys", async () => {
    const a = await generateApiKey("ws-1");
    const b = await generateApiKey("ws-1");
    expect(a.key).not.toBe(b.key);
    expect(a.hash).not.toBe(b.hash);
  });

  it("hash is 64 hex chars (SHA-256)", async () => {
    const { hash } = await generateApiKey("ws-x");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("hashApiKey", () => {
  it("is deterministic", async () => {
    const key = "ek_abc123_someSecret";
    expect(await hashApiKey(key)).toBe(await hashApiKey(key));
  });

  it("differs for different keys", async () => {
    const h1 = await hashApiKey("ek_abc123_secretA");
    const h2 = await hashApiKey("ek_abc123_secretB");
    expect(h1).not.toBe(h2);
  });
});

describe("verifyApiKey", () => {
  it("accepts correct key", async () => {
    const { key, hash } = await generateApiKey("ws-verify");
    expect(await verifyApiKey(key, hash)).toBe(true);
  });

  it("rejects wrong key", async () => {
    const { hash } = await generateApiKey("ws-verify");
    expect(await verifyApiKey("ek_wrong_key", hash)).toBe(false);
  });
});

describe("extractPrefix", () => {
  it("returns the prefix segment", () => {
    expect(extractPrefix("ek_ws1234_someSecret")).toBe("ws1234");
  });

  it("returns null for non-ek keys", () => {
    expect(extractPrefix("sk-openai-123")).toBeNull();
  });
});

describe("extractBearerKey", () => {
  it("extracts key from Bearer header", () => {
    const header = "Bearer ek_ws1234_secret";
    expect(extractBearerKey(header)).toBe("ek_ws1234_secret");
  });

  it("returns null for missing header", () => {
    expect(extractBearerKey(null)).toBeNull();
  });

  it("returns null for non-ek bearer token", () => {
    expect(extractBearerKey("Bearer sk-openai-xyz")).toBeNull();
  });
});

describe("hasScope", () => {
  const makeKey = (scopes: ApiKey["scopes"]): ApiKey => ({
    id: "k1",
    workspaceId: "ws-1",
    prefix: "ws1234",
    hash: "abc",
    name: "test",
    scopes,
    createdAt: Date.now(),
    expiresAt: null,
    lastUsedAt: null,
    rateLimit: 100,
  });

  it("returns true when scope is listed", () => {
    const k = makeKey(["chat:read", "export:read"]);
    expect(hasScope(k, "chat:read")).toBe(true);
  });

  it("returns false when scope is absent", () => {
    const k = makeKey(["chat:read"]);
    expect(hasScope(k, "admin")).toBe(false);
  });

  it("admin scope grants everything", () => {
    const k = makeKey(["admin"]);
    expect(hasScope(k, "export:read")).toBe(true);
    expect(hasScope(k, "usage:read")).toBe(true);
  });
});
