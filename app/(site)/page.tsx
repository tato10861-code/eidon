import { ArrowUpRight, BrainCircuit, Database, ShieldCheck, UserCheck } from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Features } from "@/components/marketing/features";
import { Integrations } from "@/components/marketing/integrations";
import { Security } from "@/components/marketing/security";
import { Testimonials } from "@/components/marketing/testimonials";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";
import { WorkforceGrid } from "@/components/workforce-grid";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/server";
import { getEmployeeById } from "@/lib/employees";
import type { Locale } from "@/lib/i18n/config";

const sectors = {
  en: ["Fintech", "SaaS", "Healthcare", "Retail", "Logistics", "AI-native"],
  ar: [
    "التقنية المالية",
    "البرمجيات",
    "الرعاية الصحية",
    "التجزئة",
    "اللوجستيات",
    "الذكاء الاصطناعي",
  ],
};

export default async function HomePage() {
  const { locale, t } = await getDictionary();
  const ava = getEmployeeById("ava")!;

  const demoPoints = [t.features.items[0], t.features.items[1], t.features.items[3]];
  const demoIcons = [BrainCircuit, Database, UserCheck];

  return (
    <>
      <Hero t={t} locale={locale} employee={ava} />

      <div className="border-y border-white/[0.06] bg-white/[0.012]">
        <div className="container-page flex flex-col items-center gap-4 py-5 sm:flex-row sm:justify-between">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-fog/45">
            {locale === "ar" ? "مصمّم لفرق العمل في" : "Built for operators in"}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
            {sectors[locale as keyof typeof sectors].map((sector) => (
              <span key={sector} className="text-[11px] font-medium tracking-wide text-fog/55">
                {sector}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section id="workforce" className="container-page py-24">
        <Reveal>
          <SectionHeading
            eyebrow={t.workforce.eyebrow}
            title={t.workforce.title}
            accent={t.workforce.titleAccent}
            subtitle={t.workforce.subtitle}
          />
        </Reveal>

        <div className="mt-12">
          <WorkforceGrid labels={t.workforce} locale={locale} />
        </div>

        <div className="mt-10 flex justify-center">
          <Button href="/employees" variant="secondary">
            {t.workforce.viewAll}
            <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </Button>
        </div>
      </section>

      <section
        id="demo"
        className="border-y border-white/[0.06] bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(124,140,255,0.07),transparent_60%)] py-24"
      >
        <div className="container-page grid items-center gap-14 lg:grid-cols-[0.86fr_1.14fr]">
          <Reveal>
            <SectionHeading
              eyebrow={t.demo.eyebrow}
              title={t.demo.title}
              accent={t.demo.titleAccent}
              subtitle={t.demo.subtitle}
              align="start"
            />

            <ul className="mt-8 flex flex-col gap-4">
              {demoPoints.map((point, index) => {
                const Icon = demoIcons[index] ?? ShieldCheck;
                return (
                  <li key={point.title} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-lime">
                      <Icon className="size-3.5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[13px] font-medium text-snow">{point.title}</p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-fog">{point.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button href="/playground" variant="secondary" size="sm">
                {t.hero.openPlayground}
                <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
              </Button>
              <p className="max-w-xs font-mono text-[9.5px] leading-relaxed text-fog/50">
                {t.demo.footnote}
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-6 -z-10 rounded-[40px] bg-lime/[0.035] blur-3xl"
              />
              <ChatPanel employee={ava} variant="full" />
            </div>
          </Reveal>
        </div>
      </section>

      <HowItWorks t={t.how} />
      <Features t={t.features} />
      <Integrations t={t.integrations} />
      <Security t={t.security} />
      <Testimonials t={t.testimonials} />

      <section id="pricing" className="container-page py-24">
        <Reveal>
          <SectionHeading
            eyebrow={t.pricing.eyebrow}
            title={t.pricing.title}
            accent={t.pricing.titleAccent}
            subtitle={t.pricing.subtitle}
          />
        </Reveal>
        <Reveal delay={100}>
          <PricingCards t={t.pricing} className="mt-12" />
        </Reveal>
        <p className="mt-6 text-center font-mono text-[10px] text-fog/50">{t.pricing.note}</p>
      </section>

      <section className="container-page pb-24">
        <Reveal>
          <SectionHeading eyebrow={t.faq.eyebrow} title={t.faq.title} accent={t.faq.titleAccent} />
        </Reveal>
        <Faq t={t.faq} />
      </section>

      <FinalCta t={t.cta} />
    </>
  );
}

export const dynamic = "force-static";
