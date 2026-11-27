import type { Metadata } from "next";
import {
  ArrowUpRight,
  Database,
  FileCheck2,
  Fingerprint,
  KeyRound,
  Lock,
  ScrollText,
  ServerCog,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How Eidon protects customer data: encryption, regional residency, scoped tool access, human approval, audit trails and responsible disclosure.",
  alternates: { canonical: "/security" },
};

const controls = [
  {
    icon: Lock,
    title: "Encryption everywhere",
    body: "TLS 1.3 in transit, AES-256 at rest. Keys are rotated on a schedule and never leave the managed key service.",
  },
  {
    icon: Fingerprint,
    title: "Least-privilege tools",
    body: "Every integration requests the narrowest OAuth scope. Writes to money, contracts or customer data can require approval.",
  },
  {
    icon: ScrollText,
    title: "Append-only audit trail",
    body: "Every thought, tool call, approval and handoff is recorded with actor, timestamp and payload hash. Exportable at any time.",
  },
  {
    icon: Database,
    title: "Regional residency",
    body: "Pin data to the US, EU or Middle East. Storage, processing and backups stay in the selected region.",
  },
  {
    icon: UserCheck,
    title: "Human in the loop",
    body: "Confidence thresholds and approval rules are enforced by the runtime before an outbound action — not by prompt wording alone.",
  },
  {
    icon: ServerCog,
    title: "Isolated execution",
    body: "Tool calls run in short-lived sandboxes with per-tenant credentials. No shared long-lived tokens between workspaces.",
  },
];

const practices = [
  "Threat model every new surface before it ships.",
  "Secrets live in a managed vault and are never committed.",
  "Dependencies are reviewed weekly through Dependabot and CodeQL.",
  "Production changes require review, CI and a rollback plan.",
  "Access to customer data is time-boxed and logged.",
  "Incidents get a written post-mortem within five business days.",
];

const dataFacts = [
  { label: "Training on customer data", value: "Never" },
  { label: "Data retention default", value: "Configurable" },
  { label: "Deletion SLA", value: "30 days" },
  { label: "Export formats", value: "JSON · CSV" },
];

export default function SecurityPage() {
  return (
    <>
      <section className="container-page pb-12 pt-16">
        <Reveal>
          <Eyebrow>Security</Eyebrow>
          <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.7rem,5.8vw,4.6rem)] leading-[0.98] tracking-[-0.025em] text-snow">
            Enterprise from <span className="italic text-lime">line one.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fog">
            An AI employee touches conversations, records and tools. That trust is the product. Here
            is exactly how access is scoped, how data is handled and how decisions are recorded.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="mailto:security@eidon.ai?subject=Security%20review">
              Request a security review
              <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            </Button>
            <Button
              href="https://github.com/tato10861-code/eidon/security/advisories/new"
              variant="secondary"
            >
              Report a vulnerability
            </Button>
          </div>
          <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-6 border-t border-white/[0.07] pt-7 sm:grid-cols-4">
            {dataFacts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-[10.5px] leading-tight text-fog/80">{fact.label}</dt>
                <dd className="mt-2 font-display text-[22px] leading-none text-snow">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      <section className="container-page pb-20">
        <Reveal>
          <SectionHeading
            eyebrow="Controls"
            title="Security that is"
            accent="enforced, not promised."
            subtitle="Controls live in the runtime and the platform. Each one is testable and visible in the audit log."
          />
        </Reveal>
        <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {controls.map((control) => {
            const Icon = control.icon;
            return (
              <div
                key={control.title}
                className="rounded-[22px] border border-white/[0.08] bg-[#090c12]/70 p-5"
              >
                <span className="grid size-9 place-items-center rounded-xl border border-lime/20 bg-lime/[0.06] text-lime">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[13.5px] font-semibold text-snow">{control.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-fog">{control.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[26px] border border-white/[0.08] bg-[#090c12]/70 p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-lime" aria-hidden="true" />
              <h2 className="text-[15px] font-semibold text-snow">
                Your data never trains a model
              </h2>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-fog">
              Customer content is processed to answer the request and then discarded according to
              your retention policy. It is not used to train Eidon models, and provider agreements
              disable training on API traffic. Retrieval is scoped per employee and per workspace.
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {[
                "No training on customer conversations, documents or outputs.",
                "Zero-retention options for regulated workloads.",
                "Per-employee knowledge scopes — one employee cannot read another's sources.",
                "Delete a document and it leaves retrieval on the next request.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-lime/60" />
                  <span className="text-[11.5px] leading-relaxed text-mist/90">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[26px] border border-white/[0.08] bg-[#090c12]/70 p-6">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-lime" aria-hidden="true" />
              <h2 className="text-[15px] font-semibold text-snow">How we build and operate</h2>
            </div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {practices.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-lime/60" />
                  <span className="text-[11.5px] leading-relaxed text-mist/90">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#090c12]/70">
          <div className="border-b border-white/[0.07] px-6 py-5">
            <h2 className="text-[15px] font-semibold text-snow">Compliance posture</h2>
            <p className="mt-1 text-[12px] text-fog">
              We publish the stage we are actually at. No badge before the audit closes.
            </p>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {[
              {
                name: "SOC 2 Type II",
                status: "Readiness complete · audit planned",
                tone: "amber",
              },
              { name: "GDPR", status: "DPA and data processing register in place", tone: "lime" },
              { name: "CCPA / CPRA", status: "Data subject request process defined", tone: "lime" },
              { name: "ISO 27001", status: "Roadmap · after SOC 2", tone: "fog" },
              { name: "HIPAA", status: "Available with a signed BAA on Enterprise", tone: "lime" },
            ].map((item) => (
              <div
                key={item.name}
                className="flex flex-col gap-1.5 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-[12.5px] font-medium text-snow">{item.name}</span>
                <span
                  className={
                    item.tone === "lime"
                      ? "font-mono text-[10.5px] text-emerald-300/90"
                      : item.tone === "amber"
                        ? "font-mono text-[10.5px] text-amber-200/90"
                        : "font-mono text-[10.5px] text-fog/70"
                  }
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page pb-24">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[26px] border border-lime/20 bg-[linear-gradient(180deg,rgba(203,255,90,0.05),rgba(9,12,18,0.85))] p-7">
            <div className="flex items-center gap-2">
              <FileCheck2 className="size-4 text-lime" aria-hidden="true" />
              <h2 className="font-display text-[26px] text-snow">Responsible disclosure</h2>
            </div>
            <p className="mt-3 max-w-xl text-[12.5px] leading-relaxed text-fog">
              Report vulnerabilities privately through GitHub Security Advisories or{" "}
              <a href="mailto:security@eidon.ai" className="text-lime underline underline-offset-2">
                security@eidon.ai
              </a>
              . We acknowledge within one business day, triage within three and share a remediation
              plan within ten. Good-faith research is protected.
            </p>
            <Button
              href="https://github.com/tato10861-code/eidon/security/advisories/new"
              variant="secondary"
              size="sm"
              className="mt-5"
            >
              Open a private advisory
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Button>
          </div>

          <div className="rounded-[26px] border border-white/[0.08] bg-[#090c12]/70 p-7">
            <h2 className="font-display text-[26px] text-snow">Trust documents</h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-fog">
              Architecture summary, data processing addendum, sub-processor list and
              penetration-test summary are available under NDA.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {[
                { label: "Data processing addendum", href: "/legal/dpa" },
                { label: "Sub-processors", href: "/legal/subprocessors" },
                { label: "Privacy policy", href: "/legal/privacy" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 text-[12px] text-mist transition-colors hover:border-white/15 hover:text-snow"
                >
                  {link.label}
                  <ArrowUpRight className="size-3.5 text-fog" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
