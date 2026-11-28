import type { Metadata } from "next";
import { CreditCard, Zap, Building2, ArrowUpRight, Clock, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/badge";
import { PLANS } from "@/lib/billing";

export const metadata: Metadata = {
  title: "Billing & plan — Eidon",
  description: "Manage your Eidon subscription, view usage, and upgrade your plan.",
  alternates: { canonical: "/settings/billing" },
  robots: { index: false, follow: false },
};

const planIcons: Record<string, React.ReactNode> = {
  starter: <Zap className="size-4 text-fog" aria-hidden="true" />,
  scale: <Zap className="size-4 text-lime" aria-hidden="true" />,
  enterprise: <Building2 className="size-4 text-sky-400" aria-hidden="true" />,
};

const planColors: Record<string, string> = {
  starter: "border border-white/[0.08] bg-[#090c12]/70",
  scale: "border border-lime/20 bg-lime/[0.03]",
  enterprise: "border border-sky-400/20 bg-sky-400/[0.03]",
};

export default function BillingPage() {
  // Plan data is static; real current-plan is fetched client-side from /api/billing/status
  const plans = Object.entries(PLANS) as [
    "starter" | "scale" | "enterprise",
    (typeof PLANS)[keyof typeof PLANS],
  ][];

  return (
    <div className="container-page py-14">
      <Reveal>
        <Eyebrow>Billing & plan</Eyebrow>
        <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.7rem,5.8vw,4.6rem)] leading-[0.98] tracking-[-0.025em] text-snow">
          Your subscription, <span className="italic text-lime">fully in your hands.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fog">
          Upgrade, downgrade, or manage payment details without contacting support. Every change
          takes effect instantly.
        </p>
      </Reveal>

      {/* Current plan summary (static shell — hydrated via client fetch) */}
      <section
        aria-label="Current plan"
        className="mt-10 rounded-[26px] border border-white/[0.08] bg-[#090c12]/70 p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full border border-lime/20 bg-lime/[0.07]">
              <CreditCard className="size-4 text-lime" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-snow">Free Starter plan</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-fog/55">
                250 conversations / month · 1 employee
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2 py-0.5 font-mono text-[9px] text-emerald-300">
              <span className="size-1 rounded-full bg-current" />
              Active
            </span>
            <a
              href="/api/billing/portal"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 text-[11px] font-medium text-fog transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-snow"
            >
              <Clock className="size-3" aria-hidden="true" />
              Manage billing
            </a>
          </div>
        </div>

        {/* Usage bar */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-fog/55">
              Conversations this month
            </span>
            <span className="font-mono text-[9px] text-fog/55">0 / 250</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={0}
            aria-valuemin={0}
            aria-valuemax={250}
            aria-label="Conversation usage"
            className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]"
          >
            <div className="h-full w-0 rounded-full bg-lime transition-[width] duration-500" />
          </div>
        </div>
      </section>

      {/* Plan grid */}
      <section aria-label="Available plans" className="mt-8 grid gap-3 md:grid-cols-3">
        {plans.map(([planId, plan]) => (
          <div
            key={planId}
            className={`flex flex-col gap-5 rounded-[22px] p-5 ${planColors[planId]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {planIcons[planId]}
                <h2 className="text-[14px] font-semibold text-snow">{plan.name}</h2>
              </div>
              {planId === "scale" && (
                <span className="rounded-full border border-lime/30 bg-lime/[0.08] px-2 py-0.5 font-mono text-[9px] text-lime">
                  Most popular
                </span>
              )}
            </div>

            <p className="text-[26px] font-semibold leading-none tracking-tight text-snow">
              {plan.monthlyPrice === 0 && planId !== "enterprise" ? (
                "Free"
              ) : plan.monthlyPrice === 0 ? (
                <span className="text-[16px] font-medium text-fog">Custom</span>
              ) : (
                <>
                  ${plan.monthlyPrice.toLocaleString()}
                  <span className="ml-1 text-[13px] font-normal text-fog">/mo</span>
                </>
              )}
            </p>

            <ul className="space-y-1.5 text-[11.5px] text-fog/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3 shrink-0 text-lime/70" aria-hidden="true" />
                {plan.conversations === -1
                  ? "Unlimited conversations"
                  : `${plan.conversations.toLocaleString()} conversations / mo`}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3 shrink-0 text-lime/70" aria-hidden="true" />
                {plan.employees === -1
                  ? "Unlimited AI employees"
                  : `Up to ${plan.employees} AI employee${plan.employees > 1 ? "s" : ""}`}
              </li>
              {planId !== "starter" && (
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3 shrink-0 text-lime/70" aria-hidden="true" />
                  Priority support & SLA
                </li>
              )}
              {planId === "enterprise" && (
                <>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 shrink-0 text-lime/70" aria-hidden="true" />
                    SSO / SAML & audit log
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 shrink-0 text-lime/70" aria-hidden="true" />
                    Custom data residency
                  </li>
                </>
              )}
            </ul>

            <div className="mt-auto">
              {planId === "starter" ? (
                <span className="inline-flex h-9 items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-4 text-[11px] text-fog/60">
                  Current plan
                </span>
              ) : planId === "scale" ? (
                <Button
                  href="/api/billing/checkout?plan=scale"
                  variant="primary"
                  size="sm"
                  className="w-full justify-center"
                >
                  Upgrade to Scale
                  <ArrowUpRight className="ml-1 size-3" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  href="mailto:sales@eidon.ai?subject=Enterprise%20pricing"
                  variant="secondary"
                  size="sm"
                  className="w-full justify-center"
                >
                  Contact sales
                  <ArrowUpRight className="ml-1 size-3" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Fine print */}
      <p className="mt-8 text-center text-[11px] text-fog/40">
        Plans renew monthly. Cancel anytime. All prices in USD excl. tax. Unused conversations do
        not roll over.
      </p>
    </div>
  );
}
