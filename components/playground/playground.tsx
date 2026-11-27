"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { EmployeeAvatar } from "@/components/employee-avatar";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/badge";
import { employees, getEmployeeById } from "@/lib/employees";
import { buildCustomEmployee, roleLabels } from "@/lib/custom";
import type { EmployeeConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Playground() {
  const [selectedId, setSelectedId] = useState("ava");
  const [customConfig, setCustomConfig] = useState<EmployeeConfig | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("employee");
    if (requested && getEmployeeById(requested)) setSelectedId(requested);

    if (params.get("custom") === "1") {
      try {
        const raw = window.localStorage.getItem("eidon:studio");
        if (raw) {
          const parsed = JSON.parse(raw) as EmployeeConfig;
          setCustomConfig(parsed);
          setSelectedId("custom");
        }
      } catch {
        // Ignore malformed drafts.
      }
    }
    setReady(true);
  }, []);

  const customEmployee = useMemo(
    () => (customConfig ? buildCustomEmployee(customConfig) : null),
    [customConfig],
  );

  const employee = useMemo(() => {
    if (selectedId === "custom" && customEmployee) return customEmployee;
    return getEmployeeById(selectedId) ?? employees[0];
  }, [selectedId, customEmployee]);

  const isCustom = employee.id === "custom";

  return (
    <div className="container-page py-10">
      <div className="flex flex-col justify-between gap-6 border-b border-white/[0.07] pb-8 lg:flex-row lg:items-end">
        <div>
          <Eyebrow>Runtime</Eyebrow>
          <h1 className="mt-4 font-display text-[clamp(2.2rem,4.6vw,3.4rem)] leading-none tracking-[-0.02em] text-snow">
            Put an employee <span className="italic text-lime">to work.</span>
          </h1>
          <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-fog">
            Same runtime as production. Every thought, tool call and guardrail check is visible in
            the trace. No API key required for the demo engine.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-fog">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            eidon core · online
          </span>
          <Button href="/studio" variant="secondary" size="sm">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Open studio
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[288px_1fr] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <div className="rounded-[22px] border border-white/[0.08] bg-[#090c12]/70 p-2">
            <p className="px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-fog/50">
              {customEmployee ? "Your build" : "Select an employee"}
            </p>

            {customEmployee ? (
              <button
                type="button"
                onClick={() => setSelectedId("custom")}
                className={cn(
                  "mb-1 flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-start transition-colors",
                  selectedId === "custom"
                    ? "border-lime/30 bg-lime/[0.06]"
                    : "border-transparent hover:bg-white/[0.04]",
                )}
              >
                <EmployeeAvatar employee={customEmployee} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-snow">
                    {customEmployee.name}
                  </span>
                  <span className="block truncate text-[10.5px] text-fog">
                    Custom · {roleLabels[customEmployee.role]}
                  </span>
                </span>
                <span className="rounded-full bg-lime px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-void">
                  new
                </span>
              </button>
            ) : null}

            <div className="max-h-[calc(100vh-14rem)] overflow-y-auto">
              {employees.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-start transition-colors",
                    selectedId === item.id
                      ? "border-white/[0.14] bg-white/[0.06]"
                      : "border-transparent hover:bg-white/[0.03]",
                  )}
                >
                  <EmployeeAvatar employee={item} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium text-snow">
                      {item.name}
                    </span>
                    <span className="block truncate text-[10.5px] text-fog">{item.title}</span>
                  </span>
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      item.status === "available" ? "bg-emerald-400/80" : "bg-amber-300/80",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {ready ? (
            <ChatPanel
              key={`${employee.id}-${employee.name}`}
              employee={employee}
              variant="full"
              config={isCustom ? (customConfig ?? undefined) : undefined}
            />
          ) : (
            <div className="h-[620px] animate-pulse rounded-[26px] border border-white/[0.08] bg-white/[0.02]" />
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-fog/50">Skills</p>
              <p className="mt-2 text-[12px] leading-relaxed text-mist">
                {employee.skills.slice(0, 4).join(" · ")}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-fog/50">
                Tools connected
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-mist">
                {employee.tools
                  .map((tool) => tool.name)
                  .slice(0, 4)
                  .join(" · ")}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-fog/50">
                Profile
              </p>
              <Link
                href={isCustom ? "/studio" : `/employees/${employee.slug}`}
                className="mt-2 inline-flex items-center gap-1 text-[12px] text-lime transition-opacity hover:opacity-80"
              >
                {isCustom ? "Edit in studio" : "Open full profile"}
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
