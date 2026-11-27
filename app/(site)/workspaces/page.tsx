import type { Metadata } from "next";
import { Building2, Plus } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Workspaces",
  description: "Manage Eidon workspaces — tenants, employees and conversations.",
  alternates: { canonical: "/workspaces" },
  robots: { index: false, follow: false },
};

export default function WorkspacesPage() {
  return (
    <div className="container-page py-14">
      <Reveal>
        <Eyebrow>Workspaces</Eyebrow>
        <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.7rem,5.8vw,4.6rem)] leading-[0.98] tracking-[-0.025em] text-snow">
          Your <span className="italic text-lime">workspaces.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fog">
          Each workspace is an isolated tenant with its own employees, conversations, tools and
          audit trail. Create one per company, team or environment.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/login">
            <Plus className="size-4" aria-hidden="true" />
            Create workspace
          </Button>
          <Button href="/dashboard" variant="secondary">
            Open dashboard
          </Button>
        </div>
      </Reveal>

      <section className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Isolated data",
            body: "Employees, conversations and audit logs are scoped per workspace.",
          },
          {
            title: "Per-workspace billing",
            body: "Plans and usage are tracked per workspace, not per seat.",
          },
          { title: "Regional residency", body: "Pin each workspace to US, EU or Middle East." },
          {
            title: "SSO / SCIM",
            body: "Enterprise workspaces support central identity and provisioning.",
          },
          {
            title: "Audit trail",
            body: "Every action is recorded with actor, timestamp and payload hash.",
          },
          {
            title: "Export & delete",
            body: "Export a workspace or delete it — data removed within 30 days.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-[22px] border border-white/[0.08] bg-[#090c12]/70 p-5"
          >
            <span className="grid size-9 place-items-center rounded-xl border border-lime/20 bg-lime/[0.06] text-lime">
              <Building2 className="size-4" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-[13.5px] font-semibold text-snow">{item.title}</h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-fog">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-[26px] border border-amber-300/20 bg-amber-300/[0.05] p-6">
        <h2 className="font-display text-[24px] text-snow">Status</h2>
        <p className="mt-3 text-[12.5px] leading-relaxed text-amber-100/90">
          Workspaces require a configured Supabase project (free tier). Without it the page renders
          in demo mode. Apply <code className="font-mono text-[10px]">supabase/schema.sql</code> and
          set the env vars to enable persistence.
        </p>
        <SectionHeading
          title="Ready to start?"
          accent="Create your workspace."
          subtitle="Sign in and create your first workspace in under a minute."
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/login">Sign in</Button>
          <Button href="/docs" variant="secondary">
            Read the setup guide
          </Button>
        </div>
      </section>
    </div>
  );
}
