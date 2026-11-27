import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  wordmark = true,
}: {
  className?: string;
  href?: string;
  wordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label="Eidon — home"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span className="relative grid size-8 place-items-center rounded-[10px] border border-white/10 bg-white/[0.035] transition-colors group-hover:border-lime/40">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2.6 21.4 12 12 21.4 2.6 12 12 2.6Z"
            stroke="currentColor"
            strokeWidth="1.3"
            className="text-snow/60"
          />
          <path d="M12 7.2 16.8 12 12 16.8 7.2 12 12 7.2Z" fill="var(--color-lime)" />
        </svg>
        <span className="pointer-events-none absolute inset-0 rounded-[10px] bg-lime/0 blur-md transition-colors duration-300 group-hover:bg-lime/20" />
      </span>
      {wordmark ? (
        <span className="flex items-baseline gap-1.5">
          <span className="text-[19px] font-semibold tracking-[-0.045em] text-snow">
            eidon<span className="text-lime">.</span>
          </span>
          <span className="rounded-[4px] border border-lime/25 bg-lime/[0.08] px-1 py-[1px] font-mono text-[8px] font-semibold uppercase leading-none tracking-[0.08em] text-lime">
            AI
          </span>
        </span>
      ) : null}
    </Link>
  );
}
