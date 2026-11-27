import { Quote, Star } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/ui/badge";
import type { Dict } from "@/messages/en";

export function Testimonials({ t }: { t: Dict["testimonials"] }) {
  return (
    <section className="border-y border-white/[0.06] bg-white/[0.012] py-24">
      <div className="container-page">
        <Reveal>
          <SectionHeading eyebrow={t.eyebrow} title={t.title} accent={t.titleAccent} />
        </Reveal>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {t.items.map((item, index) => (
            <Reveal key={item.name} delay={index * 80}>
              <figure className="flex h-full flex-col rounded-[24px] border border-white/[0.08] bg-[#090c12]/80 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5" aria-label="5 out of 5">
                    {Array.from({ length: 5 }).map((_, star) => (
                      <Star key={star} className="size-3 fill-lime text-lime" aria-hidden="true" />
                    ))}
                  </div>
                  <Quote className="size-4 text-white/10" aria-hidden="true" />
                </div>
                <blockquote className="mt-5 flex-1 text-[14px] leading-relaxed text-mist">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 border-t border-white/[0.06] pt-4">
                  <p className="text-[13px] font-medium text-snow">{item.name}</p>
                  <p className="mt-0.5 text-[11.5px] text-fog">{item.role}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
