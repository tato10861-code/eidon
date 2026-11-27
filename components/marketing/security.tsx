import { Globe2, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/ui/badge";
import type { Dict } from "@/messages/en";

const icons = [Lock, ShieldCheck, KeyRound, Globe2];

export function Security({ t }: { t: Dict["security"] }) {
  return (
    <section className="container-page py-24">
      <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <Reveal>
          <SectionHeading
            eyebrow={t.eyebrow}
            title={t.title}
            accent={t.titleAccent}
            subtitle={t.subtitle}
            align="start"
          />
          <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
            <div className="grid size-9 place-items-center rounded-xl border border-lime/20 bg-lime/[0.06] text-lime">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fog/60">
                Trust center
              </p>
              <p className="text-[12.5px] text-mist">SOC 2 · GDPR · ISO 27001 roadmap</p>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-px overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.06] sm:grid-cols-2">
          {t.items.map((item, index) => {
            const Icon = icons[index] ?? ShieldCheck;
            return (
              <Reveal key={item.title} delay={index * 70}>
                <div className="h-full bg-[#080b11] p-6">
                  <Icon className="size-4.5 text-lime/80" aria-hidden="true" />
                  <h3 className="mt-4 text-[14px] font-semibold text-snow">{item.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-fog">{item.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
