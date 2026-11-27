"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dict } from "@/messages/en";

export function Faq({ t }: { t: Dict["faq"] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-2.5">
      {t.items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div
            key={item.q}
            className={cn(
              "overflow-hidden rounded-2xl border transition-colors",
              isOpen
                ? "border-white/[0.14] bg-white/[0.035]"
                : "border-white/[0.07] bg-white/[0.015] hover:border-white/[0.12]",
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
            >
              <span className="text-[13.5px] font-medium text-snow">{item.q}</span>
              <Plus
                className={cn(
                  "size-4 shrink-0 text-fog transition-transform duration-300",
                  isOpen && "rotate-45 text-lime",
                )}
                aria-hidden="true"
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-[13px] leading-relaxed text-fog">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
