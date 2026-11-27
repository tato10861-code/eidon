import type { Metadata } from "next";
import { CheckCircle2, Link2, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/badge";
import { oauthProviders, isProviderConfigured } from "@/lib/oauth";

export const metadata: Metadata = {
  title: "Connected tools",
  description: "Connect OAuth providers for live tool execution with scoped access.",
  alternates: { canonical: "/settings/integrations" },
  robots: { index: false, follow: false },
};

export default function ConnectedToolsPage() {
  return (
    <div className="container-page py-14">
      <Reveal>
        <Eyebrow>Connected tools</Eyebrow>
        <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.7rem,5.8vw,4.6rem)] leading-[0.98] tracking-[-0.025em] text-snow">
          Live tool execution, <span className="italic text-lime">with approval.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fog">
          Connect your tools via OAuth. Every action is scoped, logged and can require human
          approval before it runs. Demo mode works without credentials.
        </p>
      </Reveal>

      <section className="mt-12 grid gap-3 md:grid-cols-2">
        {Object.values(oauthProviders).map((provider) => {
          const configured = isProviderConfigured(provider.id);
          return (
            <div
              key={provider.id}
              className="flex flex-col gap-4 rounded-[22px] border border-white/[0.08] bg-[#090c12]/70 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[13.5px] font-semibold text-snow">{provider.name}</h2>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-fog/55">
                    {provider.scopes.length} scopes
                  </p>
                </div>
                <span
                  className={
                    configured
                      ? "inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2 py-0.5 font-mono text-[9px] text-emerald-300"
                      : "inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-2 py-0.5 font-mono text-[9px] text-amber-200"
                  }
                >
                  <span className="size-1 rounded-full bg-current" />
                  {configured ? "Configured" : "Demo"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {provider.scopes.map((scope) => (
                  <span
                    key={scope}
                    className="rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-1 font-mono text-[9px] text-fog/70"
                  >
                    {scope}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex items-center gap-2">
                <a
                  href={`/api/oauth/${provider.id}/authorize`}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-lime/30 bg-lime/[0.06] px-4 text-[12px] font-medium text-lime transition-colors hover:bg-lime/[0.1]"
                >
                  <Link2 className="size-3.5" aria-hidden="true" />
                  {configured ? "Connect" : "Try (demo)"}
                </a>
                <span className="font-mono text-[9px] text-fog/45">
                  {configured ? "Live OAuth" : "Mock flow"}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-12 rounded-[26px] border border-white/[0.08] bg-[#090c12]/70 p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-lime" aria-hidden="true" />
          <h2 className="text-[15px] font-semibold text-snow">Approval flow</h2>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-fog">
          Actions like refunds, deletes, sends and writes return{" "}
          <code className="font-mono text-[10px]">approval_required</code> (HTTP 202) until a human
          approves. Approve via{" "}
          <code className="font-mono text-[10px]">POST /api/tools/execute</code> with{" "}
          <code className="font-mono text-[10px]">{`{ approved: true }`}</code>. Every call is
          logged.
        </p>
        <SectionHeading
          title="Test it now"
          accent="from the API."
          subtitle="POST /api/tools/execute with { tool, action, params }."
        />
        <Button href="/docs#api" variant="secondary" size="sm" className="mt-6">
          API reference
        </Button>
      </section>
    </div>
  );
}
