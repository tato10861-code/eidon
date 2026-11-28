import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(async () => ({
    rpc,
  })),
}));

vi.mock("@/lib/neon", () => ({ getNeon: vi.fn(() => null) }));

import { persistUsage } from "../lib/usage";

describe("durable usage idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rpc.mockResolvedValue({ error: null });
  });

  it("does not apply a duplicate event twice", async () => {
    await persistUsage("usage-idempotency", "chat_tokens", 12, "ava", "evt-1");
    await persistUsage("usage-idempotency", "chat_tokens", 12, "ava", "evt-1");

    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenCalledWith(
      "record_usage",
      expect.objectContaining({ p_event_id: "evt-1" }),
    );
  });
});
