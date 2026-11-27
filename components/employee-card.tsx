import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import { EmployeeAvatar } from "@/components/employee-avatar";
import type { Dict } from "@/messages/en";
import type { EmployeeTemplate } from "@/lib/types";
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

export function EmployeeCard({
  employee,
  locale,
  labels,
  className,
}: {
  employee: EmployeeTemplate;
  locale: Locale;
  labels: Dict["workforce"];
  className?: string;
}) {
  const copy =
    locale === "ar"
      ? { title: employee.ar.title, tagline: employee.ar.tagline }
      : { title: employee.title, tagline: employee.tagline };

  return (
    <Link
      href={`/employees/${employee.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#090c12]/80 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#0c1018] hover:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(520px circle at 50% -10%, ${employee.accentSoft}, transparent 55%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-3">
        <EmployeeAvatar employee={employee} size="md" showStatus />
        <div className="flex flex-col items-end gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-fog/60">
            {locale === "ar"
              ? (departmentAr[employee.department] ?? employee.department)
              : employee.department}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium",
              employee.status === "available"
                ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
                : "border-amber-300/20 bg-amber-300/[0.08] text-amber-200",
            )}
          >
            <span
              className={cn(
                "size-1 rounded-full",
                employee.status === "available" ? "bg-emerald-400" : "bg-amber-300",
              )}
            />
            {employee.status === "available" ? labels.available : labels.beta}
          </span>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="flex items-baseline gap-2">
          <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-snow">
            {employee.name}
          </h3>
          <span className="text-[12px] text-fog">{copy.title}</span>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-mist/80">{copy.tagline}</p>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-1.5">
        {employee.skills.slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-1 text-[10.5px] text-fog"
          >
            {skill}
          </span>
        ))}
        {employee.skills.length > 3 ? (
          <span className="rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-1 text-[10.5px] text-fog/60">
            +{employee.skills.length - 3}
          </span>
        ) : null}
      </div>

      <div className="relative mt-auto flex items-center justify-between border-t border-white/[0.06] pt-4">
        <div className="flex items-center gap-3 font-mono text-[10px] text-fog/70">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3 fill-lime/80 text-lime/80" aria-hidden="true" />
            {employee.rating.toFixed(1)}
          </span>
          <span>{employee.runs} runs</span>
          <span className="hidden sm:inline">{employee.responseTime}</span>
        </div>
        <span className="grid size-7 place-items-center rounded-full border border-white/10 text-fog transition-all group-hover:border-lime/40 group-hover:text-lime">
          <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
