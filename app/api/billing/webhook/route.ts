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
        processed: false,
      });
      if (error?.code !== "23505" && error) throw error;
      if (error?.code === "23505") {
        const { data: existing } = await supabase
          .from("billing_events")
          .select("processed")
          .eq("id", event.id)
          .maybeSingle();
        if (existing?.processed) return Response.json({ received: true, duplicate: true });
      }
    } else {
      await sql!`
        insert into billing_events (id, type, processed)
        values (${event.id}, ${event.type}, false)
        on conflict (id) do nothing
      `;
      const existing = await sql!`select processed from billing_events where id = ${event.id}`;
      if ((existing as { processed?: boolean }[])[0]?.processed)
        return Response.json({ received: true, duplicate: true });
    }
  } catch (error) {
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
    const status =
      event.type === "customer.subscription.deleted"
        ? "canceled"
        : typeof object.status === "string"
          ? object.status
          : "active";
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
    const plan =
      event.type === "customer.subscription.deleted" ? "starter" : stripePlanFromPrice(priceId);

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
      const { error: workspaceError } = await supabase
        .from("workspaces")
        .update({ plan })
        .eq("id", workspaceId);
      if (workspaceError) throw workspaceError;
    } else {
      await sql!`
        update workspaces set plan = ${plan} where id = ${workspaceId}
      `;
    }
  }
  if (supabase) {
    const { error } = await supabase
      .from("billing_events")
      .update({ processed: true, last_error: null })
      .eq("id", event.id);
    if (error) throw error;
  } else {
    await sql!`update billing_events set processed = true, last_error = null where id = ${event.id}`;
  }
  return Response.json({ received: true });
}
