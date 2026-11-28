import Stripe from "stripe";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export type PlanId = "starter" | "scale" | "enterprise";

export const PLAN_PRICES: Record<string, PlanId> = {}; // price_id -> plan

export const PLANS: Record<
  PlanId,
  { name: string; monthlyPrice: number; conversations: number; employees: number }
> = {
  starter: { name: "Starter", monthlyPrice: 0, conversations: 250, employees: 1 },
  scale: { name: "Scale", monthlyPrice: 499, conversations: 25000, employees: 5 },
  enterprise: { name: "Enterprise", monthlyPrice: 0, conversations: -1, employees: -1 },
};

export async function createCheckoutSession(opts: {
  workspaceId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  trialDays?: number;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: opts.customerId,
    line_items: [{ price: opts.priceId, quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: opts.trialDays,
      metadata: { workspaceId: opts.workspaceId },
    },
    metadata: { workspaceId: opts.workspaceId },
  });
}

export async function createPortalSession(opts: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: opts.customerId,
    return_url: opts.returnUrl,
  });
}

export async function getOrCreateCustomer(opts: {
  email: string;
  workspaceId: string;
  name?: string;
}): Promise<Stripe.Customer> {
  const stripe = getStripe();
  const existing = await stripe.customers.search({
    query: `metadata['workspaceId']:'${opts.workspaceId}'`,
    limit: 1,
  });
  if (existing.data.length > 0) return existing.data[0];
  return stripe.customers.create({
    email: opts.email,
    name: opts.name,
    metadata: { workspaceId: opts.workspaceId },
  });
}

export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
}

export async function constructWebhookEvent(
  body: string,
  signature: string,
): Promise<Stripe.Event> {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  return stripe.webhooks.constructEvent(body, signature, secret);
}
