import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
const maybeSingle = vi.fn();
const upsert = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(async () => ({
    from: (table: string) => {
      if (table === "usage_events") return { insert };
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle }),
          }),
        }),
        upsert,
      };
    },
  })),
}));

vi.mock("@/lib/neon", () => ({ getNeon: vi.fn(() => null) }));

import { persistUsage } from "../lib/usage";

describe("durable usage idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insert.mockResolvedValueOnce({ error: null }).mockResolvedValue({ error: { code: "23505" } });
    maybeSingle.mockResolvedValue({ data: null });
    upsert.mockResolvedValue({ error: null });
  });

  it("does not apply a duplicate event twice", async () => {
    await persistUsage("usage-idempotency", "chat_tokens", 12, "ava", "evt-1");
    await persistUsage("usage-idempotency", "chat_tokens", 12, "ava", "evt-1");

    expect(insert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});
