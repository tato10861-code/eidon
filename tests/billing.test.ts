import { describe, it, expect, vi, beforeEach } from "vitest";

const mockStripe = {
  checkout: { sessions: { create: vi.fn() } },
  billingPortal: { sessions: { create: vi.fn() } },
  customers: { search: vi.fn(), create: vi.fn() },
  subscriptions: { update: vi.fn() },
  webhooks: { constructEvent: vi.fn() },
};

vi.mock("stripe", () => ({
  default: class {
    constructor() {
      return mockStripe;
    }
  },
}));

describe("billing helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_mock";
  });

  it("createCheckoutSession returns session with correct params", async () => {
    vi.resetModules();
    vi.doMock("stripe", () => ({
      default: class {
        constructor() {
          return mockStripe;
        }
      },
    }));
    const { createCheckoutSession } = await import("../lib/billing");
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/test",
    });

    const session = await createCheckoutSession({
      workspaceId: "ws_123",
      priceId: "price_scale_monthly",
      successUrl: "https://eidon.ai/dashboard?success=1",
      cancelUrl: "https://eidon.ai/pricing",
    });

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [{ price: "price_scale_monthly", quantity: 1 }],
        metadata: { workspaceId: "ws_123" },
      }),
    );
    expect(session.id).toBe("cs_test_123");
  });

  it("getOrCreateCustomer returns existing customer when found", async () => {
    vi.resetModules();
    vi.doMock("stripe", () => ({
      default: class {
        constructor() {
          return mockStripe;
        }
      },
    }));
    const { getOrCreateCustomer } = await import("../lib/billing");
    const existingCustomer = { id: "cus_existing", email: "test@example.com" };
    mockStripe.customers.search.mockResolvedValue({ data: [existingCustomer] });

    const customer = await getOrCreateCustomer({
      email: "test@example.com",
      workspaceId: "ws_123",
    });

    expect(mockStripe.customers.create).not.toHaveBeenCalled();
    expect(customer.id).toBe("cus_existing");
  });

  it("getOrCreateCustomer creates new customer when not found", async () => {
    vi.resetModules();
    vi.doMock("stripe", () => ({
      default: class {
        constructor() {
          return mockStripe;
        }
      },
    }));
    const { getOrCreateCustomer } = await import("../lib/billing");
    mockStripe.customers.search.mockResolvedValue({ data: [] });
    mockStripe.customers.create.mockResolvedValue({ id: "cus_new", email: "new@example.com" });

    const customer = await getOrCreateCustomer({
      email: "new@example.com",
      workspaceId: "ws_new",
      name: "ACME Corp",
    });

    expect(mockStripe.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        metadata: { workspaceId: "ws_new" },
      }),
    );
    expect(customer.id).toBe("cus_new");
  });

  it("cancelSubscription sets cancel_at_period_end", async () => {
    vi.resetModules();
    vi.doMock("stripe", () => ({
      default: class {
        constructor() {
          return mockStripe;
        }
      },
    }));
    const { cancelSubscription } = await import("../lib/billing");
    mockStripe.subscriptions.update.mockResolvedValue({
      id: "sub_123",
      cancel_at_period_end: true,
    });

    const sub = await cancelSubscription("sub_123");

    expect(mockStripe.subscriptions.update).toHaveBeenCalledWith("sub_123", {
      cancel_at_period_end: true,
    });
    expect(sub.cancel_at_period_end).toBe(true);
  });

  it("throws when STRIPE_SECRET_KEY not set", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    vi.resetModules();
    // Don't mock stripe here so the real module initialises and throws
    const { createCheckoutSession } = await import("../lib/billing");

    await expect(
      createCheckoutSession({
        workspaceId: "ws_123",
        priceId: "price_123",
        successUrl: "https://eidon.ai/success",
        cancelUrl: "https://eidon.ai/cancel",
      }),
    ).rejects.toThrow("STRIPE_SECRET_KEY not configured");
  });
});
