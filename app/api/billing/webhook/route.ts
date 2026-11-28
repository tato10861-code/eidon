import { getNeon } from "@/lib/neon";
import { getSupabase } from "@/lib/supabase";
import { parseStripeEvent, stripePlanFromPrice, verifyStripeSignature } from "@/lib/billing/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

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
  } catch {
    return Response.json({ error: "Billing event could not be persisted." }, { status: 503 });
  }

  try {
    const object = event.data?.object ?? {};
    const metadata = (object.metadata ?? {}) as Record<string, unknown>;
    const subscriptionId =
      stringValue(object.subscription) ??
      (event.type.startsWith("customer.subscription.") ? stringValue(object.id) : null);
    const customerId = stringValue(object.customer);
    let workspaceId = stringValue(metadata.workspaceId);

    if (!workspaceId && subscriptionId) {
      if (supabase) {
        const { data } = await supabase
          .from("billing_subscriptions")
          .select("workspace_id")
          .eq("subscription_id", subscriptionId)
          .maybeSingle();
        workspaceId = stringValue(data?.workspace_id);
      } else {
        const rows = await sql!`
          select workspace_id from billing_subscriptions where subscription_id = ${subscriptionId} limit 1
        `;
        workspaceId = stringValue((rows as { workspace_id?: string }[])[0]?.workspace_id);
      }
    }

    const lifecycleEvent =
      event.type.startsWith("customer.subscription.") ||
      event.type === "checkout.session.completed" ||
      event.type === "invoice.paid" ||
      event.type === "invoice.payment_failed";

    if (workspaceId && lifecycleEvent) {
      const items = object.items as { data?: { price?: { id?: string } }[] } | undefined;
      const priceId = items?.data?.[0]?.price?.id ?? object.price_id;
      const existingPlan = supabase
        ? ((
            await supabase
              .from("billing_subscriptions")
              .select("plan")
              .eq("workspace_id", workspaceId)
              .maybeSingle()
          ).data?.plan as string | undefined)
        : (
            (await sql!`select plan from billing_subscriptions where workspace_id = ${workspaceId} limit 1`) as {
              plan?: string;
            }[]
          )[0]?.plan;
      const status =
        event.type === "customer.subscription.deleted"
          ? "canceled"
          : event.type === "invoice.payment_failed"
            ? "past_due"
            : event.type === "invoice.paid"
              ? "active"
              : (stringValue(object.status) ?? "active");
      const plan =
        event.type === "invoice.paid" || event.type === "invoice.payment_failed"
          ? (existingPlan ?? "starter")
          : event.type === "customer.subscription.deleted"
            ? "starter"
            : stripePlanFromPrice(priceId);
      const currentPeriodEnd =
        typeof object.current_period_end === "number"
          ? new Date(object.current_period_end * 1000).toISOString()
          : null;

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
          insert into billing_subscriptions (workspace_id, provider, customer_id, subscription_id, status, plan, current_period_end)
          values (${workspaceId}, 'stripe', ${customerId}, ${subscriptionId}, ${status}, ${plan}, ${currentPeriodEnd})
          on conflict (workspace_id) do update set
            customer_id = excluded.customer_id,
            subscription_id = excluded.subscription_id,
            status = excluded.status,
            plan = excluded.plan,
            current_period_end = excluded.current_period_end,
            updated_at = now()
        `;
        await sql!`update workspaces set plan = ${plan} where id = ${workspaceId}`;
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
  } catch {
    if (supabase) {
      await supabase
        .from("billing_events")
        .update({ last_error: "processing_failed" })
        .eq("id", event.id);
    } else {
      await sql!`update billing_events set last_error = 'processing_failed' where id = ${event.id}`;
    }
    return Response.json({ error: "Billing event processing failed." }, { status: 503 });
  }
}
