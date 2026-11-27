import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/ui/badge";
import type { Dict } from "@/messages/en";

export function HowItWorks({ t }: { t: Dict["how"] }) {
  return (
    <section className="border-y border-white/[0.06] bg-white/[0.012] py-24">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            eyebrow={t.eyebrow}
            title={t.title}
            accent={t.titleAccent}
            subtitle={t.subtitle}
          />
        </Reveal>

        <div className="relative mt-16 grid gap-px overflow-hidden rounded-[26px] border border-white/[0.08] bg-white/[0.06] md:grid-cols-2 lg:grid-cols-4">
          {t.steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 80}>
              <div className="group relative h-full bg-[#080b11] p-6 transition-colors hover:bg-[#0b0f17]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-lime/80">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px w-10 bg-gradient-to-r from-white/20 to-transparent" />
                </div>
                <h3 className="mt-8 text-[16px] font-semibold tracking-[-0.01em] text-snow">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-fog">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
