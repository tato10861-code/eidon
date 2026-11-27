import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  MessagesSquare,
  Plus,
  Sparkles,
  Zap,
} from "lucide-react";
import { AreaChart } from "@/components/dashboard/area-chart";
import { EmployeeAvatar } from "@/components/employee-avatar";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/badge";
import { employees } from "@/lib/employees";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Workforce analytics, quality scores, activity and deployments.",
  alternates: { canonical: "/dashboard" },
};

const usage = [820, 910, 870, 1040, 990, 1120, 1280, 1210, 1390, 1460, 1380, 1590, 1710, 1840];
const usageLabels = [
  "May 14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
];

const workforceRows = employees.slice(0, 8).map((employee, index) => ({
  employee,
  conversations: [4210, 3180, 7420, 1290, 2140, 1680, 940, 3210][index] ?? 1200,
  quality: [98, 96, 94, 92, 95, 97, 91, 96][index] ?? 93,
  cost: ["$0.42", "$0.31", "$0.18", "$0.55", "$0.38", "$0.61", "$0.74", "$0.29"][index] ?? "$0.40",
  status: index === 4 ? "Training" : "Live",
}));

const activity = [
  {
    name: "Ava",
    action: "booked a meeting with VP Engineering at Northwind",
    time: "2m",
    accent: "#CBFF5A",
  },
  {
    name: "Mira",
    action: "resolved a duplicate-charge ticket and refunded $48",
    time: "6m",
    accent: "#5FE9D0",
  },
  {
    name: "Atlas",
    action: "flagged an 8.2% activation drop in the EU cohort",
    time: "14m",
    accent: "#7C8CFF",
  },
  {
    name: "Rex",
    action: "advanced 3 candidates to the technical screen",
    time: "22m",
    accent: "#FFC46B",
  },
  {
    name: "Kai",
    action: "opened a patch for the p95 latency regression",
    time: "31m",
    accent: "#9FB3C8",
  },
  {
    name: "Noor",
    action: "saved a $120k renewal with a 90-day plan",
    time: "48m",
    accent: "#7DE2C3",
  },
];

const kpis = [
  {
    label: "Active employees",
    value: "8",
    suffix: "/ 12",
    delta: "+2 this month",
    trend: "up",
    icon: Bot,
  },
  {
    label: "Conversations",
    value: "24,318",
    suffix: "",
    delta: "+18.2%",
    trend: "up",
    icon: MessagesSquare,
  },
  {
    label: "Auto-resolution",
    value: "81.4%",
    suffix: "",
    delta: "+2.1 pts",
    trend: "up",
    icon: CheckCircle2,
  },
  {
    label: "Pipeline influenced",
    value: "$1.28M",
    suffix: "",
    delta: "+34.0%",
    trend: "up",
    icon: CircleDollarSign,
  },
];

export default function DashboardPage() {
  return (
    <div className="container-page py-10">
      <div className="flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-7 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2">
            <Eyebrow>Workspace</Eyebrow>
            <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.08] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-200">
              demo data
            </span>
          </div>
          <h1 className="mt-4 font-display text-[clamp(2.1rem,4.4vw,3.2rem)] leading-none tracking-[-0.02em] text-snow">
            Your workforce, <span className="italic text-lime">at a glance.</span>
          </h1>
          <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-fog">
            Northwind Labs · Production workspace · Last 14 days. Every number traces back to a
            decision log.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button href="/playground" variant="secondary" size="sm">
            <Sparkles className="size-3.5" />
            Open playground
          </Button>
          <Button href="/studio" size="sm">
            <Plus className="size-3.5" />
            New employee
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-[22px] border border-white/[0.08] bg-[#090c12]/70 p-5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-fog/50">
                  {kpi.label}
                </span>
                <Icon className="size-3.5 text-fog/50" aria-hidden="true" />
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-[32px] leading-none text-snow">{kpi.value}</span>
                {kpi.suffix ? <span className="text-[12px] text-fog/60">{kpi.suffix}</span> : null}
              </div>
              <div className="mt-3 flex items-center gap-1 text-[10.5px] text-emerald-300/90">
                <ArrowUpRight className="size-3" aria-hidden="true" />
                {kpi.delta}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[24px] border border-white/[0.08] bg-[#090c12]/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold text-snow">Conversations</h2>
              <p className="mt-0.5 text-[11px] text-fog">24,318 total · 1,840 today</p>
            </div>
            <div className="flex items-center gap-4 font-mono text-[9.5px] text-fog/60">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-lime" /> conversations
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-white/20" /> 14 days
              </span>
            </div>
          </div>
          <div className="mt-4">
            <AreaChart data={usage} labels={usageLabels} />
          </div>
        </div>

        <div className="rounded-[24px] border border-white/[0.08] bg-[#090c12]/70 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-snow">Quality bar</h2>
            <span className="font-mono text-[9px] uppercase tracking-wider text-fog/50">evals</span>
          </div>
          <div className="mt-5 flex flex-col gap-3.5">
            {workforceRows.slice(0, 5).map((row) => (
              <div key={row.employee.id}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-mist">{row.employee.name}</span>
                  <span className="font-mono text-fog/70">{row.quality}%</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${row.quality}%`,
                      backgroundColor: row.employee.accent,
                      opacity: 0.75,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-lime/20 bg-lime/[0.04] px-3 py-2.5">
            <Zap className="size-3.5 text-lime" aria-hidden="true" />
            <p className="text-[10.5px] leading-snug text-mist">
              All employees passed the last regression gate.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#090c12]/70">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
            <h2 className="text-[14px] font-semibold text-snow">Workforce</h2>
            <Link
              href="/employees"
              className="inline-flex items-center gap-1 text-[11px] text-fog transition-colors hover:text-snow"
            >
              View all <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-start">
              <thead>
                <tr className="border-b border-white/[0.06] font-mono text-[9px] uppercase tracking-wider text-fog/50">
                  <th className="px-5 py-3 text-start font-normal">Employee</th>
                  <th className="px-3 py-3 text-start font-normal">Conversations</th>
                  <th className="px-3 py-3 text-start font-normal">Quality</th>
                  <th className="px-3 py-3 text-start font-normal">Cost / task</th>
                  <th className="px-5 py-3 text-end font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {workforceRows.map((row) => (
                  <tr
                    key={row.employee.id}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <EmployeeAvatar
                          employee={row.employee}
                          size="sm"
                          className="size-8 rounded-lg text-[11px]"
                        />
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-snow">{row.employee.name}</p>
                          <p className="truncate text-[10px] text-fog/60">{row.employee.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-mist">
                      {row.conversations.toLocaleString("en")}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-mist">
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: row.employee.accent }}
                        />
                        {row.quality}%
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-fog">{row.cost}</td>
                    <td className="px-5 py-3 text-end">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px]",
                          row.status === "Live"
                            ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"
                            : "border-amber-300/20 bg-amber-300/[0.07] text-amber-200",
                        )}
                      >
                        <span className="size-1 rounded-full bg-current" />
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-[24px] border border-white/[0.08] bg-[#090c12]/70 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-snow">Live activity</h2>
              <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-emerald-300/80">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                live
              </span>
            </div>
            <ul className="mt-4 flex flex-col gap-3">
              {activity.map((item) => (
                <li key={item.action} className="flex items-start gap-2.5">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.accent }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] leading-snug text-mist">
                      <span className="font-medium text-snow">{item.name}</span> {item.action}
                    </p>
                    <p className="mt-0.5 font-mono text-[9px] text-fog/45">{item.time} ago</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[24px] border border-white/[0.08] bg-[#090c12]/70 p-5">
            <h2 className="text-[14px] font-semibold text-snow">Deployments</h2>
            <div className="mt-4 flex flex-col gap-2.5">
              {[
                { channel: "Web widget", detail: "8 employees · production", icon: Bot },
                { channel: "Slack", detail: "Ava + Mira · #revenue", icon: MessagesSquare },
                { channel: "REST API", detail: "4 keys · 99.98% uptime", icon: Clock },
              ].map((deployment) => {
                const Icon = deployment.icon;
                return (
                  <div
                    key={deployment.channel}
                    className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                  >
                    <Icon className="size-3.5 text-fog" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] text-mist">{deployment.channel}</p>
                      <p className="truncate font-mono text-[9px] text-fog/50">
                        {deployment.detail}
                      </p>
                    </div>
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-[22px] border border-white/[0.07] bg-white/[0.02] px-5 py-4 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <ArrowDownRight className="size-4 text-lime" aria-hidden="true" />
          <p className="text-[11.5px] text-fog">
            Estimated savings this month: <span className="font-medium text-snow">$38,400</span> vs.
            equivalent human hours.
          </p>
        </div>
        <Link href="/pricing" className="text-[11px] text-lime transition-opacity hover:opacity-80">
          See how pricing works
        </Link>
      </div>
    </div>
  );
}
