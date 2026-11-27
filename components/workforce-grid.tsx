"use client";

import { useMemo, useState } from "react";
import { EmployeeCard } from "@/components/employee-card";
import { employees } from "@/lib/employees";
import type { Dict } from "@/messages/en";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const departmentAr: Record<string, string> = {
  Revenue: "الإيرادات",
  Data: "البيانات",
  Support: "الدعم",
  Talent: "المواهب",
  Marketing: "التسويق",
  Finance: "المالية",
  Legal: "القانون",
  Operations: "العمليات",
  Product: "المنتج",
  Engineering: "الهندسة",
  Executive: "المكتب التنفيذي",
  "Customer Success": "نجاح العملاء",
};

export function WorkforceGrid({ labels, locale }: { labels: Dict["workforce"]; locale: Locale }) {
  const [active, setActive] = useState<string>("all");

  const departments = useMemo(
    () => Array.from(new Set(employees.map((employee) => employee.department))),
    [],
  );

  const visible = useMemo(
    () =>
      active === "all" ? employees : employees.filter((employee) => employee.department === active),
    [active],
  );

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setActive("all")}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
            active === "all"
              ? "border-lime/40 bg-lime/10 text-lime"
              : "border-white/10 bg-white/[0.02] text-fog hover:border-white/20 hover:text-snow",
          )}
        >
          {labels.all}
          <span className="ms-1.5 font-mono text-[10px] opacity-60">{employees.length}</span>
        </button>
        {departments.map((department) => (
          <button
            key={department}
            type="button"
            onClick={() => setActive(department)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
              active === department
                ? "border-lime/40 bg-lime/10 text-lime"
                : "border-white/10 bg-white/[0.02] text-fog hover:border-white/20 hover:text-snow",
            )}
          >
            {locale === "ar" ? (departmentAr[department] ?? department) : department}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((employee) => (
          <EmployeeCard key={employee.id} employee={employee} locale={locale} labels={labels} />
        ))}
      </div>
    </div>
  );
}
