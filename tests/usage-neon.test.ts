import fs from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const queries: { text: string; values: unknown[] }[] = [];

const fakeSql = (strings: TemplateStringsArray, ...values: unknown[]) => {
  queries.push({ text: strings.join("$"), values });
  return Promise.resolve([]);
};

vi.mock("@/lib/supabase", () => ({ getSupabase: vi.fn(async () => null) }));
vi.mock("@/lib/neon", () => ({ getNeon: vi.fn(() => fakeSql) }));

import { persistUsage } from "../lib/usage";

describe("neon usage persistence", () => {
  beforeEach(() => {
    queries.splice(0, queries.length);
  });

  it("increments employee_runs on conflict instead of overwriting it", async () => {
    await persistUsage("ws-neon", "conversation_turns", 1, "ava");

    expect(queries).toHaveLength(1);
    const text = queries[0].text;
    expect(text).toContain("on conflict (workspace_id, period) do update set");
    expect(text).toContain("employee_runs = case");
    expect(text).toContain("jsonb_set");
    expect(text).toContain("usage_monthly.employee_runs");
  });

  it("leaves employee_runs untouched when no employee is provided", async () => {
    await persistUsage("ws-neon", "chat_tokens", 12);

    const text = queries[0].text;
    expect(text).toContain("then usage_monthly.employee_runs");
    expect(queries[0].values).not.toContain("ava");
  });
});

describe("reserve_usage idempotency guard", () => {
  it.each(["neon/schema.sql", "supabase/schema.sql"])(
    "serializes duplicate event ids in %s",
    (file) => {
      const sql = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      expect(sql).toContain("pg_advisory_xact_lock(hashtext(p_event_id)::bigint)");
    },
  );
});
