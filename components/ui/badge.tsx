import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  dot = true,
}: {
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-mist backdrop-blur-sm",
        className,
      )}
    >
      {dot ? (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-lime" />
        </span>
      ) : null}
      {children}
    </span>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-fog",
        className,
      )}
    >
      <span className="h-px w-6 bg-lime/60" aria-hidden="true" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  accent,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  subtitle?: string;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" ? "items-center text-center" : "items-start text-start",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="max-w-3xl font-display text-[clamp(2.2rem,4.4vw,3.6rem)] leading-[1.02] tracking-[-0.02em] text-snow">
        {title} {accent ? <span className="italic text-lime">{accent}</span> : null}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "max-w-2xl text-[15px] leading-relaxed text-fog md:text-base",
            align === "center" && "mx-auto",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
