import crypto from "node:crypto";

export interface StripeEvent {
  id: string;
  type: string;
  data?: { object?: Record<string, unknown> };
}

export function verifyStripeSignature(
  rawBody: string,
  signature: string,
  secret: string,
  toleranceSeconds = 300,
) {
  const parts = signature.split(",").reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split("=", 2);
    if (key && value) (acc[key] ??= []).push(value);
    return acc;
  }, {});
  const timestamp = Number(parts.t?.[0]);
  if (
    !Number.isFinite(timestamp) ||
    Math.abs(Math.floor(Date.now() / 1000) - timestamp) > toleranceSeconds
  )
    return false;
  const signed = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
  return (parts.v1 ?? []).some((candidate) => {
    const a = Buffer.from(candidate);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

export function parseStripeEvent(rawBody: string): StripeEvent | null {
  try {
    const event = JSON.parse(rawBody) as StripeEvent;
    return typeof event.id === "string" && typeof event.type === "string" ? event : null;
  } catch {
    return null;
  }
}

export function stripePlanFromPrice(priceId: unknown) {
  const value = typeof priceId === "string" ? priceId : "";
  if (value === process.env.STRIPE_PRICE_SCALE) return "scale" as const;
  if (value === process.env.STRIPE_PRICE_ENTERPRISE) return "enterprise" as const;
  return "starter" as const;
}
