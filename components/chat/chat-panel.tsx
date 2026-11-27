"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Brain, RotateCcw, ShieldCheck, Wrench } from "lucide-react";
import { EmployeeAvatar } from "@/components/employee-avatar";
import { ChatMarkdown } from "@/components/chat/markdown";
import type { ChatMessage, EmployeeConfig, EmployeeTemplate, TraceEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type UiMessage = ChatMessage & { streaming?: boolean; failed?: boolean };

type StreamEvent =
  | { type: "meta"; model: string; mode: "live" | "demo" }
  | { type: "trace"; trace: TraceEvent }
  | { type: "delta"; text: string }
  | { type: "done"; usage: { tokens: number; latencyMs: number } }
  | { type: "error"; message: string };

const traceIcon = {
  thought: Brain,
  tool: Wrench,
  guardrail: ShieldCheck,
  handoff: ArrowUp,
} as const;

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function ChatPanel({
  employee,
  variant = "full",
  className,
  config,
}: {
  employee: EmployeeTemplate;
  variant?: "hero" | "full";
  className?: string;
  config?: Partial<EmployeeConfig>;
}) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [runtime, setRuntime] = useState<"live" | "demo">("demo");
  const [model, setModel] = useState("eidon-core");

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "0px";
    node.style.height = `${Math.min(node.scrollHeight, 120)}px`;
  }, [input]);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;

    const userMessage: UiMessage = {
      id: newId(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    const history = [...messages, userMessage];
    const assistantId = newId();

    setMessages([
      ...history,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        streaming: true,
      },
    ]);
    setInput("");
    setBusy(true);

    let content = "";
    let traces: TraceEvent[] = [];
    let meta: UiMessage["meta"];

    const update = () => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId ? { ...message, content, trace: traces, meta } : message,
        ),
      );
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.id,
          messages: history.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          config,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(
          response.status === 429
            ? "Rate limit reached. Give it a few seconds and try again."
            : "The employee could not respond.",
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const dataLine = frame.split("\n").find((line) => line.startsWith("data: "));
          if (!dataLine) continue;

          let event: StreamEvent;
          try {
            event = JSON.parse(dataLine.slice(6)) as StreamEvent;
          } catch {
            continue;
          }

          if (event.type === "meta") {
            setRuntime(event.mode);
            setModel(event.model);
            meta = {
              model: event.model,
              mode: event.mode,
              tokens: 0,
              latencyMs: 0,
            };
            update();
          } else if (event.type === "trace") {
            traces = [...traces, event.trace];
            update();
          } else if (event.type === "delta") {
            content += event.text;
            update();
          } else if (event.type === "done") {
            meta = {
              ...(meta ?? { model, mode: runtime }),
              tokens: event.usage.tokens,
              latencyMs: event.usage.latencyMs,
            };
            update();
          } else if (event.type === "error") {
            content += `\n\n> ${event.message}`;
            update();
          }
        }
      }

      if (!content.trim()) {
        content =
          "I could not produce an answer that met my quality bar. Please rephrase the request or connect a model provider.";
        update();
      }
    } catch (error) {
      content = `> ${error instanceof Error ? error.message : "Something went wrong."}`;
      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId ? { ...message, content, failed: true } : message,
        ),
      );
    } finally {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId ? { ...message, streaming: false } : message,
        ),
      );
      setBusy(false);
    }
  }

  function reset() {
    setMessages([]);
    setInput("");
    textareaRef.current?.focus();
  }

  const starters = employee.starters.slice(0, variant === "hero" ? 2 : 3);
  const empty = messages.length === 0;

  return (
    <div
      dir="ltr"
      className={cn(
        "relative overflow-hidden rounded-[26px] border border-white/10 bg-[#080b11]/95 shadow-[0_50px_140px_-50px_rgba(0,0,0,0.95)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent" />

      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <EmployeeAvatar employee={employee} size="sm" showStatus />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-[13.5px] font-medium text-snow">{employee.name}</p>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-fog">
                AI
              </span>
            </div>
            <p className="truncate text-[11px] text-fog">{employee.title} · online</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "hidden rounded-full border px-2 py-1 font-mono text-[9px] uppercase tracking-wider sm:inline-flex",
              runtime === "live"
                ? "border-lime/30 bg-lime/10 text-lime"
                : "border-white/10 bg-white/[0.03] text-fog",
            )}
          >
            {runtime === "live" ? "Live model" : "Demo runtime"}
          </span>
          <button
            type="button"
            onClick={reset}
            aria-label="New conversation"
            className="grid size-8 place-items-center rounded-full border border-white/10 text-fog transition-colors hover:border-white/20 hover:text-snow"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        aria-live="polite"
        className={cn(
          "overflow-y-auto overscroll-contain px-4 py-4",
          variant === "hero" ? "h-[318px]" : "h-[520px]",
        )}
      >
        {empty ? (
          <div className="flex min-h-full flex-col justify-center gap-5">
            <div className="flex items-start gap-3">
              <EmployeeAvatar employee={employee} size="sm" className="mt-0.5" />
              <div>
                <p className="text-[14px] font-medium text-snow">Hi — I&apos;m {employee.name}.</p>
                <p className="mt-1 text-[13px] leading-relaxed text-fog">{employee.tagline}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-fog/70">
                Try asking
              </p>
              {starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => void send(starter)}
                  className="group flex items-start gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-start text-[12.5px] leading-snug text-mist transition-colors hover:border-lime/25 hover:bg-lime/[0.04] hover:text-snow"
                >
                  <span className="mt-1 size-1 shrink-0 rounded-full bg-lime/70" />
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((message) =>
              message.role === "user" ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[86%] rounded-2xl rounded-br-md border border-white/10 bg-white/[0.07] px-3.5 py-2.5 text-[13px] leading-relaxed text-snow">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex items-start gap-2.5">
                  <EmployeeAvatar
                    employee={employee}
                    size="sm"
                    className="mt-0.5 size-7 rounded-lg text-[11px]"
                  />
                  <div className="min-w-0 flex-1 pt-0.5">
                    {message.trace?.length ? (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {message.trace.map((trace) => {
                          const Icon = traceIcon[trace.type];
                          return (
                            <span
                              key={trace.id}
                              title={trace.detail}
                              className="inline-flex items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 font-mono text-[9.5px] text-fog"
                            >
                              <Icon className="size-2.5 text-lime/70" />
                              {trace.label}
                            </span>
                          );
                        })}
                      </div>
                    ) : null}

                    {message.content ? (
                      <ChatMarkdown content={message.content} />
                    ) : message.streaming ? (
                      <div className="flex items-center gap-1.5 py-2">
                        {[0, 1, 2].map((dot) => (
                          <span
                            key={dot}
                            className="size-1.5 animate-pulse rounded-full bg-fog/60"
                            style={{ animationDelay: `${dot * 160}ms` }}
                          />
                        ))}
                        <span className="ms-1 font-mono text-[10px] text-fog/60">working</span>
                      </div>
                    ) : null}

                    {message.streaming && message.content ? (
                      <span className="mt-1 inline-block h-3.5 w-1.5 animate-blink bg-lime/80 align-middle" />
                    ) : null}

                    {message.meta && !message.streaming ? (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9.5px] text-fog/50">
                        <span>{message.meta.model}</span>
                        <span>{message.meta.tokens} tokens</span>
                        <span>{(message.meta.latencyMs / 1000).toFixed(1)}s</span>
                        <span
                          className={message.meta.mode === "live" ? "text-lime/70" : "text-fog/50"}
                        >
                          {message.meta.mode === "live" ? "live" : "demo"}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.07] p-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
          className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 transition-colors focus-within:border-lime/40"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder={`Ask ${employee.name} to do the work…`}
            aria-label={`Message ${employee.name}`}
            className="max-h-[120px] min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-[13px] leading-relaxed text-snow placeholder:text-fog/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            aria-label="Send message"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-lime text-void transition-all hover:bg-[#dcff8f] disabled:opacity-30"
          >
            {busy ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-void/25 border-t-void" />
            ) : (
              <ArrowUp className="size-4" />
            )}
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between px-1 font-mono text-[9px] text-fog/50">
          <span>Eidon Core · {model}</span>
          <span>Enter to send · Shift + Enter for a new line</span>
        </div>
      </div>
    </div>
  );
}
