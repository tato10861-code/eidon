import type { Metadata } from "next";
import { Check, Minus, Sparkles } from "lucide-react";
import { Faq } from "@/components/marketing/faq";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/badge";
import { getDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Pay for AI employees and conversations, never for seats. Starter is free forever, Scale is $499/month, Enterprise is custom. Cancel anytime.",
  alternates: { canonical: "/pricing" },
};

const comparison = [
  { label: "AI employees", values: ["1", "5", "Unlimited"] },
  { label: "Conversations / month", values: ["250", "25,000", "Volume-based"] },
  { label: "Native integrations", values: ["3", "All 50", "All 50 + custom"] },
  {
    label: "Channels",
    values: ["Web", "Web, email, Slack, WhatsApp, API", "Every channel + voice"],
  },
  { label: "Studio & trace logs", values: ["Included", "Included", "Included"] },
  { label: "Evals & quality gates", values: [false, true, true] },
  { label: "SSO / SCIM", values: [false, false, true] },
  { label: "Data residency", values: [false, false, true] },
  { label: "Private deployment / VPC", values: [false, false, true] },
  { label: "Support", values: ["Community", "Priority", "Dedicated + SLA"] },
] as const;

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return <Check className="mx-auto size-4 text-lime" aria-label="Included" />;
  }
  if (value === false) {
    return <Minus className="mx-auto size-4 text-fog/30" aria-label="Not included" />;
  }
  return <span className="text-[11.5px] text-mist/90">{value}</span>;
}

export default async function PricingPage() {
  const { t } = await getDictionary();

  return (
    <>
      <section className="container-page pb-12 pt-16">
        <Reveal>
          <div className="flex justify-center">
            <Eyebrow>Pricing</Eyebrow>
          </div>
          <h1 className="mx-auto mt-5 max-w-4xl text-center font-display text-[clamp(2.7rem,5.8vw,4.6rem)] leading-[0.98] tracking-[-0.025em] text-snow">
            Start small. <span className="italic text-lime">Hire a company.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-center text-[15px] leading-relaxed text-fog">
            {t.pricing.subtitle} Every plan includes the full studio, trace logs and unlimited
            seats.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <PricingCards t={t.pricing} className="mt-12" />
        </Reveal>

        <p className="mt-6 text-center font-mono text-[10px] text-fog/50">{t.pricing.note}</p>
      </section>

      <section className="container-page pb-20">
        <Reveal>
          <div className="overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#090c12]/70">
            <div className="border-b border-white/[0.07] px-6 py-5">
              <h2 className="text-[15px] font-semibold text-snow">Compare plans</h2>
              <p className="mt-1 text-[12px] text-fog">
                The same runtime on every plan. You scale employees and volume, not quality.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-white/[0.06] font-mono text-[9px] uppercase tracking-[0.16em] text-fog/55">
                    <th className="px-6 py-3 text-start font-normal">Capability</th>
                    <th className="px-4 py-3 text-center font-normal">Starter</th>
                    <th className="px-4 py-3 text-center font-normal text-lime">Scale</th>
                    <th className="px-4 py-3 text-center font-normal">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row) => (
                    <tr key={row.label} className="border-b border-white/[0.04] last:border-0">
                      <th
                        scope="row"
                        className="px-6 py-3.5 text-start text-[12px] font-normal text-fog"
                      >
                        {row.label}
                      </th>
                      {row.values.map((value, index) => (
                        <td key={index} className="px-4 py-3.5 text-center align-middle">
                          <Cell value={value} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container-page pb-20">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[26px] border border-lime/20 bg-[linear-gradient(180deg,rgba(203,255,90,0.05),rgba(9,12,18,0.85))] p-7">
            <span className="grid size-10 place-items-center rounded-xl border border-lime/25 bg-lime/10 text-lime">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-[26px] text-snow">Build it with our team.</h2>
            <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-fog">
              A forward-deployed engineer scopes the role, connects your tools, writes the
              guardrails and runs the first evaluation with you. Most teams go live in under two
              weeks.
            </p>
            <Button
              href="mailto:hello@eidon.ai?subject=Build%20with%20Eidon"
              className="mt-6"
              size="sm"
            >
              Book a working session
            </Button>
          </div>

          <div className="rounded-[26px] border border-white/[0.08] bg-[#090c12]/70 p-7">
            <h2 className="font-display text-[26px] text-snow">Questions before you buy?</h2>
            <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-fog">
              Talk to a human about security review, procurement, data residency or a pilot with
              your own scenarios. We reply within one business day.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button href="mailto:hello@eidon.ai" variant="secondary" size="sm">
                Talk to sales
              </Button>
              <Button href="/security" variant="ghost" size="sm">
                Security overview
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page pb-24">
        <Reveal>
          <SectionHeading eyebrow={t.faq.eyebrow} title={t.faq.title} accent={t.faq.titleAccent} />
        </Reveal>
        <Faq t={t.faq} />
      </section>
    </>
  );
}
