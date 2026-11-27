import type { Metadata } from "next";
import { ArrowUpRight, Boxes, Sparkles, Users } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "The Eidon marketplace: community-built AI employees, templates and integrations. Coming soon.",
  alternates: { canonical: "/marketplace" },
};

const categories = [
  { name: "Sales & revenue", count: "Coming soon" },
  { name: "Data & analytics", count: "Coming soon" },
  { name: "Support & success", count: "Coming soon" },
  { name: "Finance & legal", count: "Coming soon" },
  { name: "Engineering & ops", count: "Coming soon" },
  { name: "Marketing & growth", count: "Coming soon" },
];

export default function MarketplacePage() {
  return (
    <div className="container-page py-14">
      <Reveal>
        <Eyebrow>Marketplace</Eyebrow>
        <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.7rem,5.8vw,4.6rem)] leading-[0.98] tracking-[-0.025em] text-snow">
          A workforce you can <span className="italic text-lime">hire from.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fog">
          The Eidon marketplace will host community-built employees, templates and integrations —
          reviewed, versioned and installable in one click. Until it launches, every employee ships
          in the Studio and can be exported as JSON.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/studio">
            Build your own
            <Sparkles className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </Button>
          <Button href="mailto:hello@eidon.ai?subject=Marketplace%20listing" variant="secondary">
            List an employee
            <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </Button>
        </div>
      </Reveal>

      <section className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div
            key={category.name}
            className="rounded-[22px] border border-white/[0.08] bg-[#090c12]/70 p-5"
          >
            <span className="grid size-9 place-items-center rounded-xl border border-lime/20 bg-lime/[0.06] text-lime">
              <Boxes className="size-4" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-[13.5px] font-semibold text-snow">{category.name}</h2>
            <p className="mt-1.5 font-mono text-[10px] text-fog/55">{category.count}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-[26px] border border-lime/20 bg-[linear-gradient(180deg,rgba(203,255,90,0.05),rgba(9,12,18,0.85))] p-6">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-lime" aria-hidden="true" />
          <h2 className="font-display text-[24px] text-snow">Status</h2>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-fog">
          Marketplace is on the roadmap. Today you can export any build as JSON and share it
          directly. If you have a role worth publishing, write to us — we are curating the first
          listings by hand.
        </p>
        <Button
          href="mailto:hello@eidon.ai?subject=Marketplace"
          variant="secondary"
          size="sm"
          className="mt-5"
        >
          Get in touch
        </Button>
      </section>
    </div>
  );
}
