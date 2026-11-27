"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CodeBlock({
  code,
  language = "bash",
  filename,
  className,
}: {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be blocked; the code is still selectable.
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070910]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex gap-1" aria-hidden="true">
            <span className="size-1.5 rounded-full bg-white/15" />
            <span className="size-1.5 rounded-full bg-white/15" />
            <span className="size-1.5 rounded-full bg-white/15" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-fog/60">
            {filename ?? language}
          </span>
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] text-fog transition-colors hover:bg-white/[0.05] hover:text-snow"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="size-3 text-lime" /> copied
            </>
          ) : (
            <>
              <Copy className="size-3" /> copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[11.5px] leading-relaxed text-mist/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}
