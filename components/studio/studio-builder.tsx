"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  Download,
  Fingerprint,
  Plus,
  Rocket,
  Save,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { EmployeeAvatar } from "@/components/employee-avatar";
import { CodeBlock } from "@/components/code-block";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/badge";
import { employees } from "@/lib/employees";
import {
  buildCustomEmployee,
  channelOptions,
  guardrailPresets,
  readinessScore,
  roleLabels,
  toneLabels,
} from "@/lib/custom";
import { toolCatalog } from "@/lib/tools";
import type { EmployeeConfig, RoleId, Tone } from "@/lib/types";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-snow placeholder:text-fog/40 transition-colors focus:border-lime/40 focus:outline-none";

const defaultConfig: EmployeeConfig = {
  name: "Ava",
  role: "sales",
  company: "Northwind",
  tone: "consultative",
  language: "English",
  mission:
    "Book qualified meetings with VP Engineering at B2B SaaS companies between 200 and 2,000 employees. Qualify against MEDDIC and keep the CRM clean.",
  skills: [
    "Account research",
    "Outbound sequences",
    "Lead qualification (MEDDIC)",
    "Objection handling",
  ],
  tools: ["HubSpot", "Gmail", "Google Calendar", "Slack"],
  knowledge: [
    "Our ICP is B2B SaaS, 200–2,000 employees, with a VP Engineering or CTO as the economic buyer.",
    "We replace manual outbound research. Pricing starts at $24k per year, billed annually.",
    "Security: SOC 2 Type II in progress, GDPR ready, data residency in the US or EU.",
  ],
  guardrails: [
    "Never invent pricing, discounts or contractual terms.",
    "Escalate any request involving PII, security or a data breach.",
    "Require human approval before refunds above $500.",
  ],
  channels: ["Web", "Email", "Slack"],
  creativity: 35,
  autonomy: 60,
  escalation:
    "Escalate to the account executive when the prospect asks about pricing, security, legal terms or a custom contract.",
};

const steps = [
  {
    id: "identity",
    label: "Identity",
    icon: Fingerprint,
    hint: "Who is this employee?",
  },
  { id: "mind", label: "Mind", icon: Brain, hint: "How does it think?" },
  { id: "tools", label: "Tools", icon: Wrench, hint: "What can it touch?" },
  { id: "knowledge", label: "Knowledge", icon: BookOpen, hint: "What does it know?" },
  { id: "guardrails", label: "Guardrails", icon: ShieldCheck, hint: "What must it never do?" },
  { id: "deploy", label: "Deploy", icon: Rocket, hint: "Ship it." },
] as const;

function TagEditor({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const value = draft.trim();
    if (!value || values.includes(value)) return;
    onChange([...values, value]);
    setDraft("");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] text-mist"
          >
            {value}
            <button
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              aria-label={`Remove ${value}`}
              className="text-fog/60 transition-colors hover:text-rose"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2.5 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={inputClass}
        />
        <button
          type="button"
          onClick={add}
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-mist transition-colors hover:border-lime/30 hover:text-lime"
          aria-label="Add"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

function DocumentList({
  values,
  onChange,
  placeholder,
  addLabel,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {values.map((value, index) => (
        <div key={index} className="relative">
          <textarea
            value={value}
            onChange={(event) =>
              onChange(
                values.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)),
              )
            }
            rows={3}
            placeholder={placeholder}
            className={cn(inputClass, "resize-y pe-9 leading-relaxed")}
          />
          <button
            type="button"
            onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}
            aria-label="Remove item"
            className="absolute end-2 top-2 grid size-6 place-items-center rounded-md text-fog/50 transition-colors hover:bg-white/[0.06] hover:text-rose"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 px-3 py-2.5 text-[12px] text-fog transition-colors hover:border-lime/30 hover:text-lime"
      >
        <Plus className="size-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

function ToolPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return toolCatalog;
    return toolCatalog.filter(
      (tool) => tool.name.toLowerCase().includes(q) || tool.category.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search 50 integrations…"
          className={inputClass}
        />
        <span className="shrink-0 font-mono text-[10px] text-fog/60">
          {selected.length} selected
        </span>
      </div>

      <div className="mt-3 grid max-h-[320px] gap-2 overflow-y-auto pe-1 sm:grid-cols-2">
        {filtered.map((tool) => {
          const active = selected.includes(tool.name);
          return (
            <button
              key={tool.name}
              type="button"
              onClick={() =>
                onChange(
                  active ? selected.filter((name) => name !== tool.name) : [...selected, tool.name],
                )
              }
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-start transition-colors",
                active
                  ? "border-lime/30 bg-lime/[0.06]"
                  : "border-white/[0.07] bg-white/[0.02] hover:border-white/15",
              )}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tool.color }}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[12px] text-snow">{tool.name}</span>
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-fog/50">
                    {tool.category}
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-full border",
                  active ? "border-lime bg-lime text-void" : "border-white/15 text-transparent",
                )}
              >
                <Check className="size-2.5" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StudioBuilder() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<EmployeeConfig>(defaultConfig);
  const [saved, setSaved] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("eidon:studio");
      if (raw) setConfig({ ...defaultConfig, ...(JSON.parse(raw) as EmployeeConfig) });
    } catch {
      // Ignore malformed drafts.
    }

    const params = new URLSearchParams(window.location.search);
    const template = params.get("template");
    const match = employees.find(
      (employee) => employee.id === template || employee.slug === template,
    );
    if (match) {
      setConfig((previous) => ({
        ...previous,
        name: match.name,
        role: match.role,
        mission: match.playbook.deliverable,
        skills: match.skills.slice(0, 4),
        tools: match.tools.map((tool) => tool.name).slice(0, 4),
      }));
    }
  }, []);

  function update<K extends keyof EmployeeConfig>(key: K, value: EmployeeConfig[K]) {
    setConfig((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
  }

  function applyTemplate(id: string) {
    const match = employees.find((employee) => employee.id === id);
    if (!match) return;
    setConfig((previous) => ({
      ...previous,
      name: match.name,
      role: match.role,
      mission: match.playbook.deliverable,
      skills: match.skills.slice(0, 4),
      tools: match.tools.map((tool) => tool.name).slice(0, 4),
      channels: match.channels.filter((channel) =>
        ["Web", "Email", "Slack", "WhatsApp", "API"].includes(channel),
      ),
      knowledge: previous.knowledge,
      guardrails: previous.guardrails,
    }));
    setSaved(false);
  }

  function save() {
    window.localStorage.setItem("eidon:studio", JSON.stringify(config));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  function testBuild() {
    save();
    router.push("/playground?custom=1");
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${config.name.trim().toLowerCase().replace(/\s+/g, "-") || "employee"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const preview = useMemo(() => buildCustomEmployee(config), [config]);
  const score = readinessScore(config);

  const embedSnippet = `<iframe
  src="https://eidon.ai/embed/${preview.slug}"
  width="420"
  height="640"
  style="border:0;border-radius:24px"
  title="${preview.name} — AI employee"
></iframe>`;

  return (
    <div className="container-page py-10">
      <div className="flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-7 lg:flex-row lg:items-end">
        <div>
          <Eyebrow>Studio</Eyebrow>
          <h1 className="mt-4 font-display text-[clamp(2.1rem,4.4vw,3.2rem)] leading-none tracking-[-0.02em] text-snow">
            Build an employee <span className="italic text-lime">worth hiring.</span>
          </h1>
          <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-fog">
            Six steps from intent to a deployable operating profile. Every setting is testable,
            versionable and exportable as JSON.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-[12.5px] font-medium text-mist transition-colors hover:border-white/20 hover:text-snow"
          >
            {saved ? (
              <>
                <Check className="size-3.5 text-lime" /> Saved
              </>
            ) : (
              <>
                <Save className="size-3.5" /> Save draft
              </>
            )}
          </button>
          <Button onClick={() => setPublished(true)} size="md">
            <Rocket className="size-4" />
            Publish
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[22px] border border-white/[0.08] bg-[#090c12]/70 p-2">
            {steps.map((item, index) => {
              const Icon = item.icon;
              const active = index === step;
              const complete = index < step;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStep(index)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-start transition-colors",
                    active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-lg border",
                      active
                        ? "border-lime/40 bg-lime/10 text-lime"
                        : complete
                          ? "border-lime/20 bg-lime/[0.05] text-lime/70"
                          : "border-white/10 text-fog/60",
                    )}
                  >
                    {complete ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-[12.5px] font-medium",
                        active ? "text-snow" : "text-mist/80",
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="block truncate text-[10px] text-fog/50">{item.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 rounded-[18px] border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-fog/50">
                Readiness
              </span>
              <span className="font-mono text-[11px] text-lime">{score}%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-lime transition-all duration-500"
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-fog/60">
              Add knowledge and guardrails to raise the quality bar.
            </p>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="rounded-[26px] border border-white/[0.08] bg-[#090c12]/70 p-5 md:p-6">
            {step === 0 ? (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-[16px] font-semibold text-snow">Start from a template</h2>
                  <p className="mt-1 text-[12px] text-fog">
                    Pre-fill the profile, then make it yours.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {employees.map((employee) => (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => applyTemplate(employee.id)}
                        className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-2.5 py-2 text-start transition-colors hover:border-lime/25 hover:bg-lime/[0.03]"
                      >
                        <EmployeeAvatar
                          employee={employee}
                          size="sm"
                          className="size-7 rounded-lg text-[10px]"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-[11.5px] text-snow">
                            {employee.name}
                          </span>
                          <span className="block truncate text-[9px] text-fog/60">
                            {roleLabels[employee.role]}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fog/60">
                      Employee name
                    </span>
                    <input
                      value={config.name}
                      onChange={(event) => update("name", event.target.value)}
                      className={inputClass}
                      placeholder="Ava"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fog/60">
                      Company
                    </span>
                    <input
                      value={config.company}
                      onChange={(event) => update("company", event.target.value)}
                      className={inputClass}
                      placeholder="Northwind"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fog/60">
                      Role
                    </span>
                    <select
                      value={config.role}
                      onChange={(event) => update("role", event.target.value as RoleId)}
                      className={inputClass}
                    >
                      {(Object.keys(roleLabels) as RoleId[]).map((role) => (
                        <option key={role} value={role} className="bg-[#0b0e15]">
                          {roleLabels[role]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fog/60">
                      Primary language
                    </span>
                    <select
                      value={config.language}
                      onChange={(event) => update("language", event.target.value)}
                      className={inputClass}
                    >
                      {["English", "Arabic", "Spanish", "French", "German"].map((language) => (
                        <option key={language} value={language} className="bg-[#0b0e15]">
                          {language}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fog/60">
                    Tone
                  </span>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(Object.keys(toneLabels) as Tone[]).map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => update("tone", tone)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-[12px] transition-colors",
                          config.tone === tone
                            ? "border-lime/40 bg-lime/[0.07] text-lime"
                            : "border-white/10 bg-white/[0.02] text-mist hover:border-white/20",
                        )}
                      >
                        {toneLabels[tone]}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fog/60">
                    Mission
                  </span>
                  <textarea
                    value={config.mission}
                    onChange={(event) => update("mission", event.target.value)}
                    rows={4}
                    className={cn(inputClass, "resize-y leading-relaxed")}
                    placeholder="What outcome does this employee own?"
                  />
                </label>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-[16px] font-semibold text-snow">Skills</h2>
                  <p className="mt-1 text-[12px] text-fog">
                    The capabilities this employee is hired for.
                  </p>
                  <div className="mt-4">
                    <TagEditor
                      values={config.skills}
                      onChange={(next) => update("skills", next)}
                      placeholder="Add a skill and press Enter"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-mist">Creativity</span>
                      <span className="font-mono text-[11px] text-lime">{config.creativity}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={config.creativity}
                      onChange={(event) => update("creativity", Number(event.target.value))}
                      className="mt-3 w-full accent-[#cbff5a]"
                      aria-label="Creativity"
                    />
                    <p className="mt-2 text-[10.5px] text-fog/60">
                      Lower for policy and finance. Higher for marketing and ideation.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-mist">Autonomy</span>
                      <span className="font-mono text-[11px] text-lime">{config.autonomy}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={config.autonomy}
                      onChange={(event) => update("autonomy", Number(event.target.value))}
                      className="mt-3 w-full accent-[#cbff5a]"
                      aria-label="Autonomy"
                    />
                    <p className="mt-2 text-[10.5px] text-fog/60">
                      Below 40%, every outbound action waits for human approval.
                    </p>
                  </div>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fog/60">
                    Escalation rule
                  </span>
                  <textarea
                    value={config.escalation}
                    onChange={(event) => update("escalation", event.target.value)}
                    rows={3}
                    className={cn(inputClass, "resize-y leading-relaxed")}
                    placeholder="When should this employee stop and ask a human?"
                  />
                </label>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-[16px] font-semibold text-snow">Toolbelt</h2>
                  <p className="mt-1 text-[12px] text-fog">
                    Least privilege by default. Every action is logged and can require approval.
                  </p>
                  <div className="mt-4">
                    <ToolPicker
                      selected={config.tools}
                      onChange={(next) => update("tools", next)}
                    />
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fog/60">
                    Channels
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {channelOptions.map((channel) => {
                      const active = config.channels.includes(channel);
                      return (
                        <button
                          key={channel}
                          type="button"
                          onClick={() =>
                            update(
                              "channels",
                              active
                                ? config.channels.filter((item) => item !== channel)
                                : [...config.channels, channel],
                            )
                          }
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 text-[12px] transition-colors",
                            active
                              ? "border-lime/40 bg-lime/[0.08] text-lime"
                              : "border-white/10 bg-white/[0.02] text-fog hover:border-white/20",
                          )}
                        >
                          {channel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-[16px] font-semibold text-snow">Knowledge</h2>
                  <p className="mt-1 text-[12px] text-fog">
                    Ground truth this employee can retrieve. Keep each document short and specific.
                  </p>
                </div>
                <DocumentList
                  values={config.knowledge}
                  onChange={(next) => update("knowledge", next)}
                  placeholder="Paste a policy, pricing fact, product detail or playbook…"
                  addLabel="Add document"
                />
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-fog/50">
                    Retrieval scope
                  </p>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-fog">
                    Knowledge is scoped to this employee. It is never used to train a model and can
                    be deleted at any time.
                  </p>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-[16px] font-semibold text-snow">Guardrails</h2>
                  <p className="mt-1 text-[12px] text-fog">
                    Hard rules checked before every outbound action. Make them testable.
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fog/60">
                    Recommended
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {guardrailPresets.map((rule) => {
                      const active = config.guardrails.includes(rule);
                      return (
                        <button
                          key={rule}
                          type="button"
                          onClick={() =>
                            update(
                              "guardrails",
                              active
                                ? config.guardrails.filter((item) => item !== rule)
                                : [...config.guardrails, rule],
                            )
                          }
                          className={cn(
                            "max-w-full rounded-lg border px-2.5 py-1.5 text-start text-[11px] leading-snug transition-colors",
                            active
                              ? "border-lime/30 bg-lime/[0.06] text-lime"
                              : "border-white/10 bg-white/[0.02] text-fog hover:border-white/20",
                          )}
                        >
                          {rule}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fog/60">
                    Custom rules
                  </span>
                  <div className="mt-2">
                    <TagEditor
                      values={config.guardrails}
                      onChange={(next) => update("guardrails", next)}
                      placeholder="Add a rule and press Enter"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-[16px] font-semibold text-snow">Review & deploy</h2>
                  <p className="mt-1 text-[12px] text-fog">
                    This is the complete operating profile. Export it, test it, or ship it.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Name", value: config.name },
                    { label: "Role", value: roleLabels[config.role] },
                    { label: "Company", value: config.company || "—" },
                    { label: "Tone", value: toneLabels[config.tone] },
                    { label: "Skills", value: `${config.skills.length} configured` },
                    { label: "Tools", value: `${config.tools.length} connected` },
                    {
                      label: "Knowledge",
                      value: `${config.knowledge.filter(Boolean).length} documents`,
                    },
                    { label: "Guardrails", value: `${config.guardrails.length} rules` },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5"
                    >
                      <span className="font-mono text-[9px] uppercase tracking-wider text-fog/50">
                        {item.label}
                      </span>
                      <span className="text-[12px] text-mist">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={testBuild} variant="primary" size="sm">
                    <Sparkles className="size-3.5" />
                    Test this build
                  </Button>
                  <Button onClick={exportJson} variant="secondary" size="sm">
                    <Download className="size-3.5" />
                    Export JSON
                  </Button>
                  <Button onClick={save} variant="ghost" size="sm">
                    <Save className="size-3.5" />
                    Save draft
                  </Button>
                </div>

                <div>
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fog/60">
                    Embed
                  </p>
                  <CodeBlock
                    code={embedSnippet}
                    language="html"
                    filename="embed.html"
                    className="mt-2"
                  />
                </div>

                <div>
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-fog/60">
                    Config JSON
                  </p>
                  <CodeBlock
                    code={JSON.stringify(config, null, 2)}
                    language="json"
                    filename={`${config.name.toLowerCase().replace(/\s+/g, "-") || "employee"}.json`}
                    className="mt-2"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12.5px] text-fog transition-colors hover:text-snow disabled:opacity-30"
            >
              <ArrowLeft className="size-4 rtl:-scale-x-100" />
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (step === steps.length - 1) {
                  setPublished(true);
                } else {
                  setStep((value) => Math.min(steps.length - 1, value + 1));
                }
              }}
              className="inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2 text-[12.5px] font-medium text-void transition-colors hover:bg-[#dcff8f]"
            >
              {step === steps.length - 1 ? "Publish employee" : "Continue"}
              <ArrowRight className="size-4 rtl:-scale-x-100" />
            </button>
          </div>
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-24 flex flex-col gap-3">
            <div className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#090c12]/80">
              <div
                className="h-20"
                style={{
                  background: `radial-gradient(120% 120% at 30% 0%, ${preview.accentSoft}, transparent 70%), linear-gradient(160deg,#151a27,#080a10)`,
                }}
              />
              <div className="-mt-8 px-5 pb-5">
                <EmployeeAvatar
                  employee={preview}
                  size="lg"
                  showStatus
                  className="border-2 border-[#090c12]"
                />
                <h3 className="mt-3 text-[16px] font-semibold text-snow">{preview.name}</h3>
                <p className="text-[11.5px] text-fog">{preview.title}</p>
                <p className="mt-2 line-clamp-3 text-[11.5px] leading-relaxed text-mist/80">
                  {preview.tagline}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {config.tools.slice(0, 5).map((tool) => (
                    <span
                      key={tool}
                      className="rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-1 text-[9.5px] text-fog"
                    >
                      {tool}
                    </span>
                  ))}
                  {config.tools.length > 5 ? (
                    <span className="rounded-md border border-white/[0.07] px-1.5 py-1 text-[9.5px] text-fog/60">
                      +{config.tools.length - 5}
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 border-t border-white/[0.06] pt-4">
                  <div className="flex items-center justify-between font-mono text-[9px] text-fog/50">
                    <span>Readiness</span>
                    <span className="text-lime">{score}%</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-lime" style={{ width: `${score}%` }} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={testBuild}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-lime/25 bg-lime/[0.06] py-2.5 text-[12px] font-medium text-lime transition-colors hover:bg-lime/[0.1]"
                >
                  <Sparkles className="size-3.5" />
                  Test this build
                </button>
              </div>
            </div>

            <p className="px-1 font-mono text-[9px] leading-relaxed text-fog/40">
              Drafts are stored locally in this browser. Connect a workspace to persist, version and
              publish employees.
            </p>
          </div>
        </aside>
      </div>

      {published ? (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Build ready"
          onClick={() => setPublished(false)}
        >
          <div
            className="w-full max-w-md rounded-[26px] border border-white/10 bg-[#0b0e15] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid size-11 place-items-center rounded-2xl border border-lime/30 bg-lime/10 text-lime">
              <Check className="size-5" />
            </div>
            <h3 className="mt-4 font-display text-[26px] text-snow">Build ready.</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-fog">
              {config.name} has passed the readiness check with a score of {score}%. In this
              preview, builds are saved locally. A connected workspace publishes them to your embed
              URL and API key.
            </p>
            <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 font-mono text-[10px] text-fog">
              deployment · eidon-preview-{Math.random().toString(36).slice(2, 8)}
            </div>
            <div className="mt-5 flex gap-2">
              <Button onClick={testBuild} size="sm" className="flex-1">
                Open in playground
              </Button>
              <Button
                onClick={() => setPublished(false)}
                variant="secondary"
                size="sm"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
