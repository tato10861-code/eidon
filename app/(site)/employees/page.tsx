import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { WorkforceGrid } from "@/components/workforce-grid";
import { Reveal } from "@/components/reveal";
import { SectionHeading, Eyebrow } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { employees, departments } from "@/lib/employees";
import { getDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "AI Employees",
  description:
    "Twelve production-ready AI employees across sales, data, support, finance, legal, engineering, recruiting and more. Each with skills, tools, guardrails and an eval suite.",
  alternates: { canonical: "/employees" },
};

export default async function EmployeesPage() {
  const { locale, t } = await getDictionary();

  return (
    <>
      <section className="container-page pb-10 pt-16 text-center">
        <Reveal>
          <div className="flex justify-center">
            <Eyebrow>{locale === "ar" ? "الفريق" : "The workforce"}</Eyebrow>
          </div>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-[clamp(2.8rem,6vw,4.8rem)] leading-[0.98] tracking-[-0.025em] text-snow">
            {locale === "ar" ? (
              <>
                اثنا عشر متخصصًا. <span className="italic text-lime">منصة واحدة.</span>
              </>
            ) : (
              <>
                Twelve specialists. <span className="italic text-lime">One platform.</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-fog">
            {locale === "ar"
              ? "كل موظف يصل بمهارات تخصصية، وصلاحيات أدوات محددة، وحدود أمان، وحزمة تقييم. اختر من يبدأ أولًا — والباقي على المنصة."
              : "Every employee ships with domain skills, scoped tool access, guardrails and an eval suite. Pick who starts first — the platform handles the rest."}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/studio">
              {t.nav.start}
              <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            </Button>
            <Button href="/playground" variant="secondary">
              {t.nav.playground}
            </Button>
          </div>
        </Reveal>
      </section>

      <section className="container-page pb-24">
        <div className="mb-10 flex flex-wrap items-center justify-center gap-6 border-y border-white/[0.06] py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-fog/55">
          <span>{employees.length} employees</span>
          <span className="size-1 rounded-full bg-fog/30" />
          <span>{departments.length} departments</span>
          <span className="size-1 rounded-full bg-fog/30" />
          <span>50 integrations</span>
          <span className="size-1 rounded-full bg-fog/30" />
          <span>24/7 runtime</span>
        </div>

        <WorkforceGrid labels={t.workforce} locale={locale} />
      </section>

      <section className="container-page pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#080b11] px-6 py-14 text-center md:px-16">
            <div aria-hidden="true" className="absolute inset-0 dot-grid opacity-30 mask-fade-b" />
            <div className="relative">
              <SectionHeading
                title={
                  locale === "ar" ? "لا ترى الدور الذي تحتاجه؟" : "Do not see the role you need?"
                }
                accent={locale === "ar" ? "ابنِه." : "Build it."}
                subtitle={
                  locale === "ar"
                    ? "الاستوديو يحوّل أي وصف وظيفي إلى موظف كامل: مهارات، أدوات، ذاكرة، حدود، واختبارات جودة."
                    : "The studio turns any job description into a complete employee: skills, tools, memory, guardrails and quality tests."
                }
              />
              <div className="mt-7 flex justify-center">
                <Button href="/studio" size="lg">
                  {t.hero.ctaPrimary}
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
