import type { Metadata } from "next";
import {
  ArrowUpRight,
  Compass,
  Feather,
  Gauge,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "About",
  description:
    "Eidon Labs builds the AI employee category: production-ready digital teammates with a job description, scoped tools, memory and a measurable quality bar.",
  alternates: { canonical: "/about" },
};

const principles = [
  {
    icon: Compass,
    title: "Outcome over output",
    body: "An employee is measured on meetings booked, tickets resolved and variance explained — not on how polished the reply sounds.",
  },
  {
    icon: ShieldCheck,
    title: "Trust is architecture",
    body: "Least privilege, approval thresholds and an append-only audit trail are runtime features. They are not policy language.",
  },
  {
    icon: Feather,
    title: "No fake work",
    body: "If the runtime cannot ground an answer or complete an action, it says so and escalates. Confidence theatre is a bug.",
  },
  {
    icon: Gauge,
    title: "Quality is a gate",
    body: "Every employee runs a scenario suite before a shift and after every change. A regression blocks the release.",
  },
  {
    icon: HeartHandshake,
    title: "Humans stay in charge",
    body: "The employee drafts, proposes and executes within limits. A person owns every irreversible decision.",
  },
  {
    icon: Sparkles,
    title: "Small surface, sharp tools",
    body: "One clear job, the fewest tools that do it, and a deliverable someone can act on today.",
  },
];

const roles = [
  {
    title: "Founding engineer, runtime",
    location: "Remote · EU / US",
    body: "Own the agent loop: planning, tool routing, memory, guardrails and evaluation harness.",
  },
  {
    title: "Design engineer",
    location: "Remote · any timezone",
    body: "Build the studio, the trace viewer and the surfaces that make an AI employee legible.",
  },
  {
    title: "Forward-deployed engineer",
    location: "Riyadh · London · SF",
    body: "Sit with customers, scope the first role, connect tools and get an employee to production.",
  },
];

const writing = [
  {
    title: "The unit is the employee, not the prompt",
    summary: "Why a job description, a toolbelt and an eval suite beat a clever system prompt.",
  },
  {
    title: "Traces before tokens",
    summary: "How showing the tool calls first changes whether operators trust the answer.",
  },
  {
    title: "A quality bar you can regression-test",
    summary: "Turning “sounds good” into scenarios, thresholds and release gates.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="container-page pb-12 pt-16">
        <Reveal>
          <Eyebrow>About Eidon</Eyebrow>
          <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.7rem,5.8vw,4.6rem)] leading-[0.98] tracking-[-0.025em] text-snow">
            Every company will hire <span className="italic text-lime">digital employees.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-fog">
            Most tools today sell a chatbot and call it an agent: a prompt, a text box and a demo
            that falls apart on the second question. Eidon Labs is building the other thing — a
            workforce you can manage like a team.
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-fog">
            The name comes from the Greek <em className="text-mist">eidos</em>: form, shape, the
            intelligible structure of a thing. An employee is not a model. It is a complete
            operating profile — role, skills, tools, memory, guardrails and a quality bar.
          </p>
        </Reveal>
      </section>

      <section className="container-page pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { value: "12", label: "Operating profiles" },
            { value: "50", label: "Native integrations" },
            { value: "6", label: "Studio stages" },
            { value: "1", label: "Streaming runtime" },
          ].map((fact) => (
            <div
              key={fact.label}
              className="rounded-[22px] border border-white/[0.08] bg-[#090c12]/70 p-5"
            >
              <p className="font-display text-[30px] leading-none text-snow">{fact.value}</p>
              <p className="mt-2 text-[10.5px] text-fog/80">{fact.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-20">
        <Reveal>
          <SectionHeading
            eyebrow="Principles"
            title="What we optimize for,"
            accent="and what we refuse."
            subtitle="These are product constraints, not values on a wall. They decide what ships."
          />
        </Reveal>
        <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {principles.map((principle) => {
            const Icon = principle.icon;
            return (
              <div
                key={principle.title}
                className="rounded-[22px] border border-white/[0.08] bg-[#090c12]/70 p-5"
              >
                <span className="grid size-9 place-items-center rounded-xl border border-lime/20 bg-lime/[0.06] text-lime">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[13.5px] font-semibold text-snow">{principle.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-fog">{principle.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="careers" className="container-page scroll-mt-24 pb-20">
        <Reveal>
          <SectionHeading
            eyebrow="Careers"
            title="Build the category"
            accent="with us."
            subtitle="Small team, high ownership, real customers. If the work below sounds like your next five years, write to us."
            align="start"
          />
        </Reveal>
        <div className="mt-8 flex flex-col gap-2.5">
          {roles.map((role) => (
            <a
              key={role.title}
              href={`mailto:careers@eidon.ai?subject=${encodeURIComponent(role.title)}`}
              className="group flex flex-col gap-2 rounded-[20px] border border-white/[0.08] bg-[#090c12]/70 p-5 transition-colors hover:border-lime/25 hover:bg-[#0b0f17] sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 className="text-[13.5px] font-medium text-snow">{role.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-fog">{role.body}</p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-fog/60">
                  <MapPin className="size-3" aria-hidden="true" />
                  {role.location}
                </span>
                <ArrowUpRight
                  className="size-4 text-fog transition-colors group-hover:text-lime"
                  aria-hidden="true"
                />
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="blog" className="container-page scroll-mt-24 pb-20">
        <Reveal>
          <SectionHeading
            eyebrow="Writing"
            title="Notes from"
            accent="the build."
            subtitle="Published as the platform ships — architecture decisions, evaluation practice and what breaks in production."
            align="start"
          />
        </Reveal>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {writing.map((post) => (
            <article
              key={post.title}
              className="flex flex-col rounded-[22px] border border-white/[0.08] bg-[#090c12]/70 p-5"
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-lime/70">
                Engineering note
              </span>
              <h3 className="mt-3 text-[14px] font-medium leading-snug text-snow">{post.title}</h3>
              <p className="mt-2 flex-1 text-[11.5px] leading-relaxed text-fog">{post.summary}</p>
              <a
                href="https://github.com/tato10861-code/eidon/discussions"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-[11px] text-mist transition-colors hover:text-lime"
              >
                Discuss on GitHub
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="container-page pb-24">
        <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#080b11] px-6 py-14 text-center md:px-16">
          <div aria-hidden="true" className="absolute inset-0 dot-grid opacity-30 mask-fade-b" />
          <div className="relative">
            <SectionHeading
              title="The work starts"
              accent="with one employee."
              subtitle="Build one, put it in front of a customer, and measure what changes. That is the whole thesis."
            />
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button href="/studio" size="lg">
                Build your AI employee
              </Button>
              <Button href="mailto:hello@eidon.ai" variant="secondary" size="lg">
                Talk to the team
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
