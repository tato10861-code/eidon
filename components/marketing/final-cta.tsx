import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dict } from "@/messages/en";

export function FinalCta({ t }: { t: Dict["cta"] }) {
  return (
    <section className="container-page py-24">
      <div className="relative overflow-hidden rounded-[32px] border border-white/[0.09] bg-[#080b11] px-6 py-16 text-center md:px-16">
        <div aria-hidden="true" className="absolute inset-0 grid-lines opacity-40 mask-fade-b" />
        <div
          aria-hidden="true"
          className="absolute -top-40 left-1/2 h-80 w-[640px] -translate-x-1/2 rounded-full bg-lime/[0.09] blur-[100px]"
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-[clamp(2.2rem,4.4vw,3.6rem)] leading-[1.02] tracking-[-0.02em] text-snow">
            {t.title} <span className="italic text-lime">{t.titleAccent}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[14px] leading-relaxed text-fog">{t.subtitle}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/studio" size="lg">
              {t.primary}
              <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            </Button>
            <Button href="mailto:hello@eidon.ai" variant="secondary" size="lg">
              {t.secondary}
            </Button>
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-fog/50">
            {t.note}
          </p>
        </div>
      </div>
    </section>
  );
}
