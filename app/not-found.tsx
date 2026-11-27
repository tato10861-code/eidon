import Link from "next/link";
import { ArrowUpRight, SearchX } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo />
      <div className="mt-10 grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-fog">
        <SearchX className="size-7" aria-hidden="true" />
      </div>
      <h1 className="mt-6 font-display text-[clamp(3rem,8vw,5rem)] leading-none tracking-[-0.025em] text-snow">
        404
      </h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-fog">
        That page does not exist — or it moved. Head back to the workforce, or build something new.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button href="/">
          Home
          <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
        </Button>
        <Button href="/employees" variant="secondary">
          Meet the workforce
        </Button>
      </div>
    </div>
  );
}
