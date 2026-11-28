import { getNeon } from "@/lib/neon";
import { parseStripeEvent, stripePlanFromPrice, verifyStripeSignature } from "@/lib/billing/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret)
    return Response.json({ error: "Stripe billing is not configured." }, { status: 503 });
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  if (!verifyStripeSignature(rawBody, signature, secret)) {
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }
  const event = parseStripeEvent(rawBody);
  if (!event) return Response.json({ error: "Invalid Stripe event." }, { status: 400 });
  const sql = getNeon();
  if (!sql) return Response.json({ received: true, persisted: false });

  try {
    await sql`insert into billing_events (id, type) values (${event.id}, ${event.type})`;
  } catch {
    return Response.json({ received: true, duplicate: true });
  }

  const object = event.data?.object ?? {};
  const metadata = (object.metadata ?? {}) as Record<string, unknown>;
  const workspaceId = typeof metadata.workspaceId === "string" ? metadata.workspaceId : null;
  if (
    workspaceId &&
    (event.type.startsWith("customer.subscription.") || event.type === "checkout.session.completed")
  ) {
    const items = object.items as { data?: { price?: { id?: string } }[] } | undefined;
    const priceId = items?.data?.[0]?.price?.id ?? object.price_id;
    const status = typeof object.status === "string" ? object.status : "active";
    const subscriptionId = typeof object.id === "string" ? object.id : null;
    const customerId = typeof object.customer === "string" ? object.customer : null;
    const currentPeriodEnd =
      typeof object.current_period_end === "number"
        ? new Date(object.current_period_end * 1000).toISOString()
        : null;
    await sql`
      insert into billing_subscriptions (workspace_id, provider, customer_id, subscription_id, status, plan, current_period_end)
      values (${workspaceId}, 'stripe', ${customerId}, ${subscriptionId}, ${status}, ${stripePlanFromPrice(priceId)}, ${currentPeriodEnd})
      on conflict (workspace_id) do update set customer_id = excluded.customer_id, subscription_id = excluded.subscription_id, status = excluded.status, plan = excluded.plan, current_period_end = excluded.current_period_end, updated_at = now()
    `;
  }
  return Response.json({ received: true });
}
