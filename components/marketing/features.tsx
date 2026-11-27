import { Activity, BrainCircuit, Database, FlaskConical, Layers, UserCheck } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/ui/badge";
import type { Dict } from "@/messages/en";

const icons = [BrainCircuit, Database, FlaskConical, UserCheck, Layers, Activity];

export function Features({ t }: { t: Dict["features"] }) {
  return (
    <section id="platform" className="container-page py-24">
      <Reveal>
        <SectionHeading
          eyebrow={t.eyebrow}
          title={t.title}
          accent={t.titleAccent}
          subtitle={t.subtitle}
        />
      </Reveal>

      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {t.items.map((item, index) => {
          const Icon = icons[index] ?? BrainCircuit;
          return (
            <Reveal key={item.title} delay={index * 60}>
              <div className="group relative h-full overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#090c12]/70 p-6 transition-colors hover:border-white/[0.16]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-lime/[0.05] blur-2xl transition-opacity duration-500 group-hover:bg-lime/[0.09]"
                />
                <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lime">
                  <Icon className="size-4.5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-[15px] font-semibold tracking-[-0.01em] text-snow">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-fog">{item.body}</p>
                <div className="mt-6 h-px w-full bg-gradient-to-r from-lime/30 via-white/[0.06] to-transparent" />
                <p className="mt-3 font-mono text-[9.5px] uppercase tracking-[0.18em] text-fog/45">
                  0{index + 1} / eidon core
                </p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
