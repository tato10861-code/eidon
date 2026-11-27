"use client";

import { useMemo, useState } from "react";
import { Check, Lock, Search, Wrench } from "lucide-react";
import { toolCatalog, toolCategories } from "@/lib/tools";
import { cn } from "@/lib/utils";

const categories = ["All", ...toolCategories] as const;

export function IntegrationExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return toolCatalog.filter((tool) => {
      const matchesCategory = category === "All" || tool.category === category;
      const matchesQuery =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.scopes.some((scope) => scope.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative flex-1 lg:max-w-md">
          <span className="sr-only">Search integrations</span>
          <Search
            className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-fog/50"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${toolCatalog.length} integrations, scopes or categories…`}
            className="h-11 w-full rounded-full border border-white/10 bg-white/[0.03] ps-10 pe-4 text-[13px] text-snow placeholder:text-fog/45 transition-colors focus:border-lime/40 focus:outline-none"
          />
        </label>

        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fog/55">
          {filtered.length} of {toolCatalog.length} integrations
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {categories.map((item) => {
          const active = category === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[12px] transition-colors",
                active
                  ? "border-lime/40 bg-lime/[0.08] text-lime"
                  : "border-white/10 bg-white/[0.02] text-fog hover:border-white/20 hover:text-snow",
              )}
            >
              {item}
            </button>
          );
        })}
      </div>

      {filtered.length ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => (
            <article
              key={tool.name}
              className="group flex flex-col rounded-[20px] border border-white/[0.08] bg-[#090c12]/70 p-5 transition-colors hover:border-white/15 hover:bg-[#0b0f17]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10"
                    style={{ backgroundColor: `${tool.color}1a`, color: tool.color }}
                  >
                    <Wrench className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-[13.5px] font-medium text-snow">{tool.name}</h3>
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-fog/50">
                      {tool.category}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                    tool.status === "ga"
                      ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"
                      : "border-amber-300/20 bg-amber-300/[0.07] text-amber-200",
                  )}
                >
                  {tool.status === "ga" ? "GA" : "Beta"}
                </span>
              </div>

              <p className="mt-3 flex-1 text-[12px] leading-relaxed text-fog">{tool.description}</p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {tool.scopes.map((scope) => (
                  <span
                    key={scope}
                    className="inline-flex items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-1 font-mono text-[9px] text-fog/70"
                  >
                    <Lock className="size-2.5" aria-hidden="true" />
                    {scope}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-1.5 border-t border-white/[0.06] pt-3 text-[10.5px] text-fog/60">
                <Check className="size-3 text-lime/70" aria-hidden="true" />
                Scoped OAuth · audit logged
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-[24px] border border-dashed border-white/10 py-16 text-center">
          <p className="text-[14px] text-mist">No integrations match that search.</p>
          <p className="mt-1 text-[12px] text-fog">
            Try a category, a tool name, or a scope such as <code>tickets:write</code>.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("All");
            }}
            className="mt-4 rounded-full border border-lime/30 px-4 py-2 text-[12px] text-lime transition-colors hover:bg-lime/10"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
