import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/ui/badge";
import { toolCatalog, type ToolMeta } from "@/lib/tools";
import type { Dict } from "@/messages/en";

function ToolPill({ tool }: { tool: ToolMeta }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3.5 py-2">
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: tool.color }}
        aria-hidden="true"
      />
      <span className="text-[12px] font-medium text-mist">{tool.name}</span>
      <span className="font-mono text-[9px] uppercase tracking-wider text-fog/50">
        {tool.category}
      </span>
    </span>
  );
}

function MarqueeRow({ tools, reverse }: { tools: ToolMeta[]; reverse?: boolean }) {
  const doubled = [...tools, ...tools];
  return (
    <div className="mask-fade-x overflow-hidden">
      <div
        className={`flex w-max gap-2.5 ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        } hover:[animation-play-state:paused]`}
      >
        {doubled.map((tool, index) => (
          <ToolPill key={`${tool.name}-${index}`} tool={tool} />
        ))}
      </div>
    </div>
  );
}

export function Integrations({ t }: { t: Dict["integrations"] }) {
  const first = toolCatalog.slice(0, 24);
  const second = toolCatalog.slice(24);

  return (
    <section className="overflow-hidden py-24">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            eyebrow={t.eyebrow}
            title={t.title}
            accent={t.titleAccent}
            subtitle={t.subtitle}
          />
        </Reveal>
      </div>

      <div className="mt-12 flex flex-col gap-2.5">
        <MarqueeRow tools={first} />
        <MarqueeRow tools={second} reverse />
      </div>

      <div className="container-page mt-10 flex justify-center">
        <Link
          href="/integrations"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12.5px] font-medium text-mist transition-colors hover:border-lime/30 hover:text-lime"
        >
          {t.viewAll}
          <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
