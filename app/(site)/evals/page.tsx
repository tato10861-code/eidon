import type { Metadata } from "next";
import {
  BarChart3,
  CheckCircle2,
  FlaskConical,
  GitBranch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Evals",
  description:
    "Eidon's evaluation studio: scenario suites, regression gates and quality scores for every AI employee before and after every change.",
  alternates: { canonical: "/evals" },
};

const suites = [
  { name: "Grounding", body: "Every answer must cite a source or state that it cannot." },
  {
    name: "Guardrails",
    body: "Policy violations, PII leakage and unsafe actions are blocked before output.",
  },
  { name: "Tool use", body: "Correct tool selection, scoped arguments and graceful failure." },
  { name: "Tone & format", body: "Concise, structured, no tables, one clear next step." },
  { name: "Escalation", body: "Uncertainty and irreversible actions escalate to a human." },
  {
    name: "Regression",
    body: "A changed employee must not regress on any prior passing scenario.",
  },
];

export default function EvalsPage() {
  return (
    <div className="container-page py-14">
      <Reveal>
        <Eyebrow>Evaluation studio</Eyebrow>
        <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.7rem,5.8vw,4.6rem)] leading-[0.98] tracking-[-0.025em] text-snow">
          Quality is a <span className="italic text-lime">gate, not a vibe.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fog">
          Every employee runs a scenario suite before a shift and after every change. A regression
          blocks the release. Evals are the difference between "sounds good" and "ships."
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/studio">
            Build an employee
            <Sparkles className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </Button>
          <Button href="/docs" variant="secondary">
            Read the eval guide
          </Button>
        </div>
      </Reveal>

      <section className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {suites.map((suite) => (
          <div
            key={suite.name}
            className="rounded-[22px] border border-white/[0.08] bg-[#090c12]/70 p-5"
          >
            <span className="grid size-9 place-items-center rounded-xl border border-lime/20 bg-lime/[0.06] text-lime">
              <FlaskConical className="size-4" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-[13.5px] font-semibold text-snow">{suite.name}</h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-fog">{suite.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[26px] border border-white/[0.08] bg-[#090c12]/70 p-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-lime" aria-hidden="true" />
            <h2 className="text-[15px] font-semibold text-snow">How a gate works</h2>
          </div>
          <ol className="mt-4 flex flex-col gap-3">
            {[
              "Author scenarios in natural language with expected outcomes.",
              "Run the suite against the current employee build.",
              "Compare scores against the baseline; any regression fails the gate.",
              "Block publish until the regression is fixed or explicitly waived.",
            ].map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 font-mono text-[10px] text-lime/70">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-[12px] leading-relaxed text-mist/90">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-[26px] border border-lime/20 bg-[linear-gradient(180deg,rgba(203,255,90,0.05),rgba(9,12,18,0.85))] p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-lime" aria-hidden="true" />
            <h2 className="font-display text-[24px] text-snow">Status</h2>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-fog">
            Scenario authoring and regression gates ship with the Studio today. The hosted eval
            dashboard with score history, trend charts and team review is in early access — request
            access below.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button href="mailto:hello@eidon.ai?subject=Eval%20studio%20access" size="sm">
              Request access
            </Button>
            <Button href="/studio" variant="secondary" size="sm">
              Open studio
            </Button>
          </div>
          <div className="mt-5 flex items-center gap-2 font-mono text-[9.5px] text-fog/55">
            <GitBranch className="size-3" aria-hidden="true" />
            Roadmap: hosted evals · score history · CI gate
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-[26px] border border-white/[0.08] bg-[#090c12]/70 p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-lime" aria-hidden="true" />
          <h2 className="text-[15px] font-semibold text-snow">What ships today</h2>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            "Per-employee quality bar (checks list)",
            "Readiness score in the studio",
            "Guardrail presets and custom rules",
            "Trace log for every decision",
            "Regression gate documented in CONTRIBUTING",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-lime/60" />
              <span className="text-[11.5px] leading-relaxed text-mist/90">{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
