import { ArrowRight, ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Dict } from "@/messages/en";
import type { EmployeeTemplate } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";

export function Hero({
  t,
  locale,
  employee,
}: {
  t: Dict;
  locale: Locale;
  employee: EmployeeTemplate;
}) {
  const stats = [
    { value: "12", label: t.stats.roles },
    { value: "50", label: t.stats.tools },
    { value: "99.98%", label: t.stats.uptime },
    { value: "24/7", label: t.stats.always },
  ];

  return (
    <section className="relative overflow-hidden pb-16 pt-12 lg:pb-24 lg:pt-20">
      <div className="container-page">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] xl:gap-20">
          <div className="relative">
            <Badge>{t.hero.badge}</Badge>

            <h1 className="mt-6 font-display text-[clamp(2.9rem,6.6vw,5.2rem)] leading-[0.98] tracking-[-0.025em] text-snow">
              <span className="block">{t.hero.titleA}</span>
              <span className="block italic text-lime-gradient">{t.hero.titleB}</span>
            </h1>

            <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-fog md:text-[17px]">
              {t.hero.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href="/studio" size="lg">
                {t.hero.ctaPrimary}
                <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
              </Button>
              <Button href="/employees" variant="secondary" size="lg">
                {t.hero.ctaSecondary}
                <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
              </Button>
            </div>

            <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-fog/60">
              {t.hero.note}
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/[0.07] pt-7 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="font-display text-[26px] leading-none text-snow">{stat.value}</dd>
                  <dd className="mt-2 text-[10.5px] leading-tight text-fog/80">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-8 -z-10 rounded-[48px] bg-lime/[0.045] blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-10 -top-10 -z-10 h-44 rounded-full bg-indigo/[0.14] blur-[90px]"
            />

            <div className="relative animate-float [animation-duration:9s]">
              <ChatPanel employee={employee} variant="hero" />
            </div>

            <div className="absolute -start-4 top-24 z-10 hidden animate-float items-center gap-2 rounded-xl border border-white/10 bg-[#0b0e15]/95 px-3 py-2 shadow-xl shadow-black/50 backdrop-blur-md xl:flex [animation-delay:-2s]">
              <ShieldCheck className="size-3.5 text-lime" aria-hidden="true" />
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-mist">
                guardrail · passed
              </span>
            </div>

            <div className="absolute -end-3 bottom-28 z-10 hidden animate-float items-center gap-2 rounded-xl border border-white/10 bg-[#0b0e15]/95 px-3 py-2 shadow-xl shadow-black/50 backdrop-blur-md xl:flex [animation-delay:-4s]">
              <Sparkles className="size-3.5 text-lime" aria-hidden="true" />
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-mist">
                42% reply rate
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between px-2 font-mono text-[9.5px] text-fog/45">
              <span>runtime · eidon-core</span>
              <span>{locale === "ar" ? "متوسط الاستجابة 1.8 ثانية" : "avg response 1.8s"}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
