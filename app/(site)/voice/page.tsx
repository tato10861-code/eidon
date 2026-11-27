import type { Metadata } from "next";
import { Mic, Phone, Radio, Volume2 } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Voice",
  description: "Voice channel for Eidon AI employees: phone numbers, real-time speech and IVR.",
  alternates: { canonical: "/voice" },
};

export default function VoicePage() {
  return (
    <div className="container-page py-14">
      <Reveal>
        <Eyebrow>Voice channel</Eyebrow>
        <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.7rem,5.8vw,4.6rem)] leading-[0.98] tracking-[-0.025em] text-snow">
          Your employees, <span className="italic text-lime">on the phone.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fog">
          Voice brings Eidon employees to phone numbers and live calls — real-time speech,
          interruption handling and the same guardrails as chat. On the roadmap; request early
          access below.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="mailto:hello@eidon.ai?subject=Voice%20early%20access">
            Request early access
            <Mic className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </Button>
          <Button href="/playground" variant="secondary">
            Try chat instead
          </Button>
        </div>
      </Reveal>

      <section className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Phone,
            title: "Phone numbers",
            body: "Provision numbers in minutes and route calls to an employee.",
          },
          {
            icon: Mic,
            title: "Real-time speech",
            body: "Low-latency STT and TTS with barge-in and turn-taking.",
          },
          {
            icon: Radio,
            title: "Live transfer",
            body: "Warm handoff to a human with full context.",
          },
          {
            icon: Volume2,
            title: "Same guardrails",
            body: "Policy checks and approvals apply to voice too.",
          },
        ].map((item) => {
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
      </section>

      <section className="mt-12 rounded-[26px] border border-amber-300/20 bg-amber-300/[0.05] p-6">
        <h2 className="font-display text-[24px] text-snow">Status</h2>
        <p className="mt-3 text-[12.5px] leading-relaxed text-amber-100/90">
          Voice is on the roadmap and not yet available in production. Chat and embed cover the same
          runtime today. Early access is opening to design partners.
        </p>
      </section>
    </div>
  );
}
