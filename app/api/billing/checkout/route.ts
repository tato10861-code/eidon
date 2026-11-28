import type { NextRequest } from "next/server";
import { createCheckoutSession, getOrCreateCustomer } from "@/lib/billing";
import { getNeon } from "@/lib/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { workspaceId?: string; priceId?: string; email?: string; trialDays?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workspaceId, priceId, email, trialDays } = body;
  if (!workspaceId || !priceId || !email) {
    return Response.json(
      { error: "workspaceId, priceId, and email are required" },
      { status: 400 },
    );
  }

  try {
    const neon = getNeon();
    let customerId: string | undefined;

    if (neon) {
      type Row = { stripe_customer_id: string | null };
      const rows =
        (await neon`SELECT stripe_customer_id FROM workspaces WHERE id = ${workspaceId}`) as Row[];
      customerId = rows[0]?.stripe_customer_id ?? undefined;
    }

    if (!customerId) {
      const customer = await getOrCreateCustomer({ email, workspaceId });
      customerId = customer.id;
      if (neon) {
        await neon`UPDATE workspaces SET stripe_customer_id = ${customerId} WHERE id = ${workspaceId}`;
      }
    }

    const origin = request.headers.get("origin") ?? "https://eidon.ai";
    const session = await createCheckoutSession({
      workspaceId,
      priceId,
      customerId,
      trialDays,
      successUrl: `${origin}/dashboard?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/pricing?billing=cancelled`,
    });

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Billing error";
    return Response.json({ error: message }, { status: 500 });
  }
}
