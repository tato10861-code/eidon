import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  Clock,
  Globe2,
  MessagesSquare,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import { EmployeeAvatar } from "@/components/employee-avatar";
import { EmployeeCard } from "@/components/employee-card";
import { ChatPanel } from "@/components/chat/chat-panel";
import { CodeBlock } from "@/components/code-block";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/badge";
import { employees, getEmployee } from "@/lib/employees";
import { getDictionary } from "@/lib/i18n/server";
import { siteUrl } from "@/lib/utils";

export function generateStaticParams() {
  return employees.map((employee) => ({ slug: employee.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const employee = getEmployee(slug);
  if (!employee) return { title: "Employee not found" };

  return {
    title: `${employee.name} — ${employee.title}`,
    description: employee.description,
    alternates: { canonical: `/employees/${employee.slug}` },
    openGraph: {
      title: `${employee.name} — ${employee.title} · Eidon`,
      description: employee.tagline,
      url: `/employees/${employee.slug}`,
    },
  };
}

export default async function EmployeePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const employee = getEmployee(slug);
  if (!employee) notFound();

  const { t } = await getDictionary();
  const related = employees
    .filter((item) => item.id !== employee.id)
    .sort((a, b) =>
      a.department === employee.department ? -1 : b.department === employee.department ? 1 : 0,
    )
    .slice(0, 3);

  const embedSnippet = `<iframe
  src="${siteUrl}/embed/${employee.slug}"
  width="420"
  height="640"
  style="border:0;border-radius:24px"
  title="${employee.name} — AI employee"
></iframe>`;

  const apiSnippet = `curl -N ${siteUrl}/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "employeeId": "${employee.id}",
    "messages": [
      { "role": "user", "content": "${employee.starters[0]}" }
    ]
  }'`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${employee.name} — ${employee.title}`,
    description: employee.description,
    brand: { "@type": "Brand", name: "Eidon" },
    category: "AI Employee",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Starter plan includes one AI employee.",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: employee.rating,
      bestRating: 5,
      ratingCount: Math.round(Number.parseFloat(employee.runs) * 100) || 100,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="container-page pt-10">
        <nav className="flex items-center gap-2 text-[11px] text-fog/60" aria-label="Breadcrumb">
          <Link href="/employees" className="transition-colors hover:text-snow">
            Employees
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-mist">{employee.name}</span>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <div className="flex flex-wrap items-start gap-5">
              <EmployeeAvatar employee={employee} size="xl" showStatus />
              <div className="min-w-0">
                <Eyebrow>{employee.department}</Eyebrow>
                <h1 className="mt-3 font-display text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.95] tracking-[-0.025em] text-snow">
                  {employee.name}
                </h1>
                <p className="mt-2 text-[15px] text-mist">{employee.title}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10.5px] text-fog">
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="size-3 fill-lime text-lime" aria-hidden="true" />
                    {employee.rating.toFixed(1)} / 5
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BadgeCheck className="size-3 text-lime/70" aria-hidden="true" />
                    {employee.runs} runs
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3" aria-hidden="true" />
                    {employee.responseTime} response
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    {employee.status === "available" ? "Available now" : "Beta"}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-7 max-w-2xl text-[15px] leading-relaxed text-fog">
              {employee.description}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/studio">
                Hire {employee.name}
                <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
              </Button>
              <Button href="/playground" variant="secondary">
                <MessagesSquare className="size-4" aria-hidden="true" />
                Test in playground
              </Button>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/[0.08] bg-[#090c12]/80 p-6">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-fog/60">
              Performance · last 30 days
            </p>
            <div className="mt-5 grid gap-4">
              {employee.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-baseline justify-between border-b border-white/[0.06] pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-[12px] text-fog">{metric.label}</span>
                  <span className="font-display text-[24px] leading-none text-snow">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-5">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-fog/50">
                  Channels
                </p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-mist">
                  {employee.channels.join(" · ")}
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-fog/50">
                  Languages
                </p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-mist">
                  {employee.languages.join(" · ")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page mt-20 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="flex flex-col gap-4">
          <Reveal>
            <div className="rounded-[26px] border border-white/[0.08] bg-[#090c12]/60 p-6">
              <Eyebrow>Skills</Eyebrow>
              <h2 className="mt-3 text-[18px] font-semibold tracking-[-0.01em] text-snow">
                What {employee.name} does
              </h2>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {employee.skills.map((skill) => (
                  <div
                    key={skill}
                    className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                  >
                    <Check className="size-3.5 shrink-0 text-lime/80" aria-hidden="true" />
                    <span className="text-[12.5px] text-mist">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="rounded-[26px] border border-white/[0.08] bg-[#090c12]/60 p-6">
              <Eyebrow>Operating principles</Eyebrow>
              <h2 className="mt-3 text-[18px] font-semibold tracking-[-0.01em] text-snow">
                How {employee.name} thinks
              </h2>
              <ol className="mt-5 flex flex-col gap-4">
                {employee.playbook.approach.map((step, index) => (
                  <li key={step} className="flex gap-4">
                    <span className="mt-0.5 font-mono text-[10px] text-lime/70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-[13px] leading-relaxed text-mist/90">{step}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-fog/50">
                  Default deliverable
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-mist">
                  {employee.playbook.deliverable}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-[26px] border border-white/[0.08] bg-[#090c12]/60 p-6">
              <Eyebrow>Toolbelt</Eyebrow>
              <h2 className="mt-3 text-[18px] font-semibold tracking-[-0.01em] text-snow">
                Connected systems
              </h2>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {employee.tools.map((tool) => (
                  <div
                    key={tool.name}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Wrench className="size-3.5 shrink-0 text-fog" aria-hidden="true" />
                      <span className="truncate text-[12.5px] text-mist">{tool.name}</span>
                    </div>
                    <span className="shrink-0 font-mono text-[9px] text-fog/50">
                      {tool.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <div className="flex flex-col gap-4">
          <Reveal delay={60}>
            <div className="rounded-[26px] border border-lime/20 bg-[linear-gradient(180deg,rgba(203,255,90,0.05),rgba(9,12,18,0.8))] p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-lime" aria-hidden="true" />
                <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-lime/80">
                  Quality bar
                </p>
              </div>
              <ul className="mt-4 flex flex-col gap-3">
                {employee.playbook.checks.map((check) => (
                  <li key={check} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-lime/70" aria-hidden="true" />
                    <span className="text-[12px] leading-relaxed text-mist/90">{check}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-[26px] border border-white/[0.08] bg-[#090c12]/60 p-6">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-fog/60">
                Deploy · embed
              </p>
              <CodeBlock
                code={embedSnippet}
                language="html"
                filename="embed.html"
                className="mt-4"
              />
              <p className="mt-5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-fog/60">
                Deploy · API
              </p>
              <CodeBlock code={apiSnippet} language="bash" filename="terminal" className="mt-4" />
              <div className="mt-4 flex items-center gap-2 text-[11px] text-fog">
                <Globe2 className="size-3.5" aria-hidden="true" />
                Streaming SSE · scoped tools · audit trail
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-page mt-20">
        <div className="flex flex-col gap-3 text-center">
          <Eyebrow className="justify-center">Live runtime</Eyebrow>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-snow">
            Put {employee.name} to work.
          </h2>
          <p className="mx-auto max-w-xl text-[13.5px] text-fog">
            The same runtime that powers production. Try a real task, inspect the tool calls, and
            see the quality bar in action.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-3xl">
          <ChatPanel employee={employee} variant="full" />
        </div>
      </section>

      <section className="container-page mt-24">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-[28px] text-snow">More of the workforce</h2>
          <Link
            href="/employees"
            className="inline-flex items-center gap-1 text-[12px] text-fog transition-colors hover:text-snow"
          >
            All employees
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <EmployeeCard key={item.id} employee={item} locale="en" labels={t.workforce} />
          ))}
        </div>
      </section>
    </>
  );
}
