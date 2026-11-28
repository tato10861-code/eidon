import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { accessError, authorizeWorkspace } from "@/lib/auth/authorization";

const originalRequireAuth = process.env.EIDON_REQUIRE_AUTH;
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

afterEach(() => {
  if (originalRequireAuth === undefined) delete process.env.EIDON_REQUIRE_AUTH;
  else process.env.EIDON_REQUIRE_AUTH = originalRequireAuth;
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  if (originalSupabaseUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
});

describe("workspace authorization", () => {
  it("allows only the explicit demo workspace when durable auth is disabled", async () => {
    delete process.env.EIDON_REQUIRE_AUTH;
    delete process.env.DATABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const request = new NextRequest("http://localhost/api/chat");
    await expect(authorizeWorkspace(request, "demo", "chat:write")).resolves.toMatchObject({
      kind: "demo",
    });
    await expect(authorizeWorkspace(request, "other", "chat:write")).rejects.toMatchObject({
      status: 401,
    });
  });

  it("rejects anonymous access when a durable database is configured", async () => {
    process.env.EIDON_REQUIRE_AUTH = "true";
    const request = new NextRequest("http://localhost/api/chat");
    await expect(authorizeWorkspace(request, "demo", "chat:write")).rejects.toMatchObject({
      status: 401,
    });
  });

  it("maps denied access to a safe response", () => {
    const response = accessError(new Error("unexpected"));
    expect(response.status).toBe(500);
  });
});
