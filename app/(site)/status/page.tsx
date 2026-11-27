import type { Metadata } from "next";
import { Activity, CheckCircle2, Clock, Radio } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Eyebrow } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Status",
  description:
    "Eidon platform status: API, web app, chat runtime, studio and integrations. Current state and 90-day uptime.",
  alternates: { canonical: "/status" },
};

const services = [
  { name: "Web app", detail: "Marketing, profiles and dashboard", uptime: "99.99%" },
  { name: "Chat runtime", detail: "Streaming SSE and tool traces", uptime: "99.98%" },
  { name: "API", detail: "/api/chat · /api/employees", uptime: "99.98%" },
  { name: "Studio", detail: "Builder and draft persistence", uptime: "99.99%" },
  { name: "Integrations", detail: "OAuth connections and tool calls", uptime: "99.97%" },
  { name: "Embed widget", detail: "Frameable employee surface", uptime: "99.99%" },
];

const incidents = [
  {
    date: "No incidents",
    title: "All clear",
    body: "No customer-impacting incidents recorded in the last 90 days.",
    tone: "ok",
  },
];

export default function StatusPage() {
  const days = Array.from({ length: 90 }, (_, index) => index);

  return (
    <div className="container-page py-14">
      <Reveal>
        <div className="flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-7 sm:flex-row sm:items-end">
          <div>
            <Eyebrow>Status</Eyebrow>
            <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,3.8rem)] leading-none tracking-[-0.025em] text-snow">
              All systems <span className="italic text-lime">operational.</span>
            </h1>
            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-fog">
              Live state for every Eidon surface. This page ships with the platform as a static
              baseline — connect your monitoring provider to make it live.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
            </span>
            Operational
          </div>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Reveal>
          <div className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#090c12]/70">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <h2 className="text-[14px] font-semibold text-snow">Components</h2>
              <span className="font-mono text-[9px] uppercase tracking-wider text-fog/50">
                90-day uptime
              </span>
            </div>
            <ul className="divide-y divide-white/[0.05]">
              {services.map((service) => (
                <li
                  key={service.name}
                  className="flex items-center justify-between gap-4 px-5 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <CheckCircle2
                      className="size-3.5 shrink-0 text-emerald-400"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-snow">{service.name}</p>
                      <p className="truncate font-mono text-[9px] text-fog/50">{service.detail}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden font-mono text-[10px] text-fog/60 sm:inline">
                      {service.uptime}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-2 py-0.5 font-mono text-[9px] text-emerald-300">
                      <span className="size-1 rounded-full bg-emerald-400" />
                      Up
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <div className="flex flex-col gap-4">
          <Reveal delay={80}>
            <div className="rounded-[24px] border border-white/[0.08] bg-[#090c12]/70 p-5">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-lime" aria-hidden="true" />
                <h2 className="text-[14px] font-semibold text-snow">Uptime · 90 days</h2>
              </div>
              <p className="mt-4 font-display text-[34px] leading-none text-snow">99.98%</p>
              <p className="mt-1 font-mono text-[9.5px] text-fog/55">
                target 99.9% · Enterprise 99.99%
              </p>
              <div className="mt-4 flex gap-[2px]" aria-hidden="true">
                {days.map((day) => (
                  <span
                    key={day}
                    className="h-7 flex-1 rounded-[1px] bg-emerald-400/70"
                    style={{ opacity: day % 17 === 0 ? 0.55 : 1 }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between font-mono text-[9px] text-fog/40">
                <span>90 days ago</span>
                <span>today</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-[24px] border border-white/[0.08] bg-[#090c12]/70 p-5">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-fog" aria-hidden="true" />
                <h2 className="text-[14px] font-semibold text-snow">Response targets</h2>
              </div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {[
                  ["First response", "4 business hours"],
                  ["Status updates", "every 30 minutes"],
                  ["Post-mortem", "5 business days"],
                ].map(([label, value]) => (
                  <li key={label} className="flex items-center justify-between text-[11.5px]">
                    <span className="text-fog">{label}</span>
                    <span className="font-mono text-[10.5px] text-mist">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>

      <section className="mt-10">
        <div className="flex items-center gap-2">
          <Radio className="size-4 text-lime" aria-hidden="true" />
          <h2 className="text-[14px] font-semibold text-snow">Incident history</h2>
        </div>
        <div className="mt-4 flex flex-col gap-2.5">
          {incidents.map((incident) => (
            <div
              key={incident.title}
              className="rounded-[20px] border border-emerald-400/15 bg-emerald-400/[0.03] px-5 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12.5px] font-medium text-snow">{incident.title}</p>
                <span className="font-mono text-[9.5px] text-fog/50">{incident.date}</span>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-fog">{incident.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 font-mono text-[9.5px] leading-relaxed text-fog/40">
          Uptime figures on this page are illustrative demo data. Wire the page to your provider to
          publish real measurements.
        </p>
      </section>
    </div>
  );
}
