import type { NextRequest } from "next/server";
import { accessError, authorizeWorkspace } from "@/lib/auth/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const priceFor = (plan: string) =>
  plan === "enterprise"
    ? process.env.STRIPE_PRICE_ENTERPRISE
    : plan === "scale"
      ? process.env.STRIPE_PRICE_SCALE
      : null;

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret)
    return Response.json({ error: "Stripe billing is not configured." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { workspaceId?: string; plan?: string };
  const workspaceId = body.workspaceId?.trim();
  const plan = body.plan?.trim() ?? "";
  const price = priceFor(plan);
  if (!workspaceId || !price)
    return Response.json(
      { error: "workspaceId and a supported plan are required." },
      { status: 400 },
    );
  let principal;
  try {
    principal = await authorizeWorkspace(request, workspaceId, "admin");
  } catch (error) {
    return accessError(error);
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const form = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    success_url: `${origin}/settings/billing?checkout=success`,
    cancel_url: `${origin}/settings/billing?checkout=cancelled`,
    client_reference_id: workspaceId,
    "metadata[workspaceId]": workspaceId,
    "metadata[plan]": plan,
    "metadata[actor]": principal.subject,
  });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  if (!response.ok)
    return Response.json({ error: "Stripe checkout could not be created." }, { status: 502 });
  const session = (await response.json()) as { id?: string; url?: string };
  if (!session.url)
    return Response.json({ error: "Stripe returned no checkout URL." }, { status: 502 });
  return Response.json({ id: session.id, url: session.url, plan });
}
