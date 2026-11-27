"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { localeMeta, locales, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function choose(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    document.cookie = `eidon_locale=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 text-[12px] font-medium text-mist transition-colors hover:border-white/20 hover:text-snow",
          pending && "opacity-60",
        )}
      >
        <Globe2 className="size-3.5" aria-hidden="true" />
        {localeMeta[locale].short}
        <ChevronDown
          className={cn("size-3 text-fog transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Language"
          className="absolute end-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0f16]/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl"
        >
          {locales.map((item) => (
            <button
              key={item}
              type="button"
              role="option"
              aria-selected={item === locale}
              onClick={() => choose(item)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-start text-[13px] transition-colors",
                item === locale
                  ? "bg-white/[0.06] text-snow"
                  : "text-fog hover:bg-white/[0.04] hover:text-snow",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-fog">{localeMeta[item].short}</span>
                {localeMeta[item].label}
              </span>
              {item === locale ? <Check className="size-3.5 text-lime" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
