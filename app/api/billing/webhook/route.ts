import type { NextRequest } from "next/server";
import { constructWebhookEvent } from "@/lib/billing";
import { getNeon } from "@/lib/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe sends the raw body — must NOT parse as JSON before constructing the event
export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return Response.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Awaited<ReturnType<typeof constructWebhookEvent>>;
  try {
    event = await constructWebhookEvent(rawBody, sig);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return Response.json({ error: message }, { status: 400 });
  }

  const neon = getNeon();
  if (!neon) {
    return Response.json({ received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const workspaceId = session.metadata?.workspaceId;
        if (workspaceId && session.subscription) {
          const plan = "scale";
          await neon`
            UPDATE workspaces
            SET plan = ${plan}, stripe_subscription_id = ${String(session.subscription)}
            WHERE id = ${workspaceId}
          `;
          await neon`
            INSERT INTO audit_log (workspace_id, actor, action, target, payload)
            VALUES (${workspaceId}, 'stripe', 'subscription.activated', ${plan},
                    ${JSON.stringify({ sessionId: session.id })}::jsonb)
          `;
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const workspaceId = sub.metadata?.workspaceId;
        if (workspaceId) {
          const plan = sub.status === "active" ? "scale" : "starter";
          await neon`UPDATE workspaces SET plan = ${plan} WHERE id = ${workspaceId}`;
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const workspaceId = sub.metadata?.workspaceId;
        if (workspaceId) {
          await neon`
            UPDATE workspaces
            SET plan = 'starter', stripe_subscription_id = null
            WHERE id = ${workspaceId}
          `;
          await neon`
            INSERT INTO audit_log (workspace_id, actor, action, payload)
            VALUES (${workspaceId}, 'stripe', 'subscription.cancelled',
                    ${JSON.stringify({ subscriptionId: sub.id })}::jsonb)
          `;
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;
        type Row = { id: string };
        const rows =
          (await neon`SELECT id FROM workspaces WHERE stripe_customer_id = ${customerId}`) as Row[];
        if (rows[0]) {
          await neon`
            INSERT INTO audit_log (workspace_id, actor, action, payload)
            VALUES (${rows[0].id}, 'stripe', 'payment.failed',
                    ${JSON.stringify({ invoiceId: invoice.id, amount: invoice.amount_due })}::jsonb)
          `;
        }
        break;
      }
    }
  } catch {
    // Non-fatal — always acknowledge to prevent Stripe retries
  }

  return Response.json({ received: true });
}
