import type { Metadata } from "next";
import { ArrowUpRight, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { IntegrationExplorer } from "@/components/integrations/integration-explorer";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/badge";
import { toolCatalog, toolCategories } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "50 native integrations across CRM, support, data, finance, recruiting, engineering and marketing — with scoped OAuth, least-privilege access and a full audit trail.",
  alternates: { canonical: "/integrations" },
};

const principles = [
  {
    icon: KeyRound,
    title: "Scoped OAuth",
    body: "Every connection requests the narrowest scope that does the job. No all-or-nothing tokens.",
  },
  {
    icon: ShieldCheck,
    title: "Approval by default",
    body: "Writes that touch money, contracts or customer data can require a human approval first.",
  },
  {
    icon: RefreshCw,
    title: "Revocable instantly",
    body: "Disconnect a tool and the employee loses access on the next request — no cached credentials.",
  },
];

export default function IntegrationsPage() {
  const ga = toolCatalog.filter((tool) => tool.status === "ga").length;
  const beta = toolCatalog.length - ga;

  return (
    <>
      <section className="container-page pb-10 pt-16">
        <Reveal>
          <Eyebrow>Integrations</Eyebrow>
          <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.7rem,5.8vw,4.6rem)] leading-[0.98] tracking-[-0.025em] text-snow">
            Works with the tools <span className="italic text-lime">you already live in.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fog">
            {toolCatalog.length} native integrations across {toolCategories.length} categories. Each
            one is scoped, logged and revocable. Anything we do not cover is reachable through the
            REST API, webhooks or Zapier.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/docs#api">
              Read the API docs
              <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            </Button>
            <Button href="/studio" variant="secondary">
              Build an employee
            </Button>
          </div>
          <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-6 border-t border-white/[0.07] pt-7 sm:grid-cols-4">
            {[
              { value: String(toolCatalog.length), label: "Native integrations" },
              { value: String(toolCategories.length), label: "Categories" },
              { value: String(ga), label: "Generally available" },
              { value: String(beta), label: "In beta" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-[26px] leading-none text-snow">{stat.value}</dd>
                <dd className="mt-2 text-[10.5px] leading-tight text-fog/80">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      <section className="container-page pb-16">
        <IntegrationExplorer />
      </section>

      <section className="container-page pb-24">
        <div className="grid gap-3 md:grid-cols-3">
          {principles.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-[22px] border border-white/[0.08] bg-[#090c12]/70 p-5"
              >
                <span className="grid size-9 place-items-center rounded-xl border border-lime/20 bg-lime/[0.06] text-lime">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-[13.5px] font-semibold text-snow">{item.title}</h2>
                <p className="mt-1.5 text-[12px] leading-relaxed text-fog">{item.body}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-[22px] border border-white/[0.07] bg-white/[0.02] px-6 py-5 sm:flex-row">
          <p className="text-[12.5px] text-fog">
            Need something custom? The API and webhooks cover any system with an HTTP endpoint.
          </p>
          <Button href="/docs" variant="ghost" size="sm">
            Integration guide
            <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
          </Button>
        </div>
      </section>
    </>
  );
}
