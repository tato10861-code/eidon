import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dict } from "@/messages/en";
import { cn } from "@/lib/utils";

export function PricingCards({ t, className }: { t: Dict["pricing"]; className?: string }) {
  return (
    <div className={cn("grid gap-4 lg:grid-cols-3", className)}>
      {t.plans.map((plan, index) => {
        const popular = index === 1;
        return (
          <div
            key={plan.name}
            className={cn(
              "relative flex flex-col rounded-[26px] border p-6",
              popular
                ? "border-lime/30 bg-[linear-gradient(180deg,rgba(203,255,90,0.055),rgba(9,12,18,0.9))] shadow-[0_30px_100px_-50px_rgba(203,255,90,0.35)]"
                : "border-white/[0.08] bg-[#090c12]/70",
            )}
          >
            {popular ? (
              <span className="absolute -top-2.5 start-6 rounded-full bg-lime px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-void">
                {t.popular}
              </span>
            ) : null}

            <p className="text-[13px] font-medium text-mist">{plan.name}</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-[42px] leading-none tracking-[-0.02em] text-snow">
                {plan.price}
              </span>
              {plan.period ? <span className="text-[12px] text-fog">{plan.period}</span> : null}
            </div>
            <p className="mt-3 min-h-10 text-[12.5px] leading-relaxed text-fog">
              {plan.description}
            </p>

            <ul className="mt-6 flex flex-1 flex-col gap-2.5 border-t border-white/[0.06] pt-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check
                    className={cn(
                      "mt-0.5 size-3.5 shrink-0",
                      popular ? "text-lime" : "text-fog/70",
                    )}
                    aria-hidden="true"
                  />
                  <span className="text-[12.5px] leading-snug text-mist/90">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              href={index === 2 ? "mailto:hello@eidon.ai?subject=Eidon%20Enterprise" : "/studio"}
              variant={popular ? "primary" : "secondary"}
              className="mt-7 w-full"
            >
              {plan.cta}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
