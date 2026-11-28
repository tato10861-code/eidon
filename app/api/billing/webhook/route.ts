import { getNeon } from "@/lib/neon";
import { getSupabase } from "@/lib/supabase";
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

  const supabase = await getSupabase();
  const sql = getNeon();
  if (!supabase && !sql) return Response.json({ received: true, persisted: false });

  try {
    if (supabase) {
      const { error } = await supabase.from("billing_events").insert({
        id: event.id,
        type: event.type,
      });
      if (error?.code === "23505") return Response.json({ received: true, duplicate: true });
      if (error) throw error;
    } else {
      await sql!`insert into billing_events (id, type) values (${event.id}, ${event.type})`;
    }
  } catch (error) {
    if (String(error).includes("duplicate key"))
      return Response.json({ received: true, duplicate: true });
    return Response.json({ error: "Billing event could not be persisted." }, { status: 503 });
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
    const subscriptionId =
      typeof object.subscription === "string"
        ? object.subscription
        : typeof object.id === "string"
          ? object.id
          : null;
    const customerId = typeof object.customer === "string" ? object.customer : null;
    const currentPeriodEnd =
      typeof object.current_period_end === "number"
        ? new Date(object.current_period_end * 1000).toISOString()
        : null;
    const plan = stripePlanFromPrice(priceId);

    if (supabase) {
      const { error } = await supabase.from("billing_subscriptions").upsert(
        {
          workspace_id: workspaceId,
          provider: "stripe",
          customer_id: customerId,
          subscription_id: subscriptionId,
          status,
          plan,
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id" },
      );
      if (error) throw error;
    } else {
      await sql!`
        insert into billing_subscriptions (workspace_id, provider, customer_id, subscription_id, status, plan, current_period_end)
        values (${workspaceId}, 'stripe', ${customerId}, ${subscriptionId}, ${status}, ${plan}, ${currentPeriodEnd})
        on conflict (workspace_id) do update set customer_id = excluded.customer_id, subscription_id = excluded.subscription_id, status = excluded.status, plan = excluded.plan, current_period_end = excluded.current_period_end, updated_at = now()
      `;
    }
  }
  return Response.json({ received: true });
}
