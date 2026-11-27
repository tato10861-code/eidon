import { cn } from "@/lib/utils";
import type { EmployeeTemplate } from "@/lib/types";

const sizeMap = {
  sm: "size-10 rounded-xl text-[15px]",
  md: "size-14 rounded-2xl text-[21px]",
  lg: "size-20 rounded-[22px] text-[30px]",
  xl: "size-28 rounded-[28px] text-[42px]",
} as const;

export function EmployeeAvatar({
  employee,
  size = "md",
  className,
  showStatus = false,
}: {
  employee: Pick<EmployeeTemplate, "name" | "initials" | "accent" | "accentSoft">;
  size?: keyof typeof sizeMap;
  className?: string;
  showStatus?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden border border-white/10",
        sizeMap[size],
        className,
      )}
      style={{
        background: `radial-gradient(120% 120% at 20% 0%, ${employee.accentSoft}, transparent 62%), linear-gradient(155deg, #151a27 0%, #080a10 100%)`,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full opacity-70" fill="none">
        <circle cx="50" cy="50" r="29" stroke={employee.accent} strokeOpacity="0.16" />
        <circle cx="50" cy="50" r="42" stroke={employee.accent} strokeOpacity="0.08" />
        <path
          d="M50 3v94M3 50h94"
          stroke={employee.accent}
          strokeOpacity="0.06"
          strokeWidth="0.5"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <span
          className="font-display leading-none tracking-[-0.02em]"
          style={{ color: employee.accent, fontSize: "1.05em" }}
        >
          {employee.initials}
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
      {showStatus ? (
        <span className="absolute bottom-1.5 end-1.5 size-2.5 rounded-full border-2 border-void bg-emerald-400" />
      ) : null}
    </div>
  );
}
