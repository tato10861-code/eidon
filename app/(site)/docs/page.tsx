import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  Braces,
  Code2,
  GitBranch,
  Radio,
  Rocket,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { CodeBlock } from "@/components/code-block";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/badge";
import { siteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Eidon documentation: quickstart, environment variables, streaming API reference, embed guide, architecture and changelog.",
  alternates: { canonical: "/docs" },
};

const sections = [
  { id: "quickstart", label: "Quickstart", icon: Rocket },
  { id: "configuration", label: "Configuration", icon: Terminal },
  { id: "api", label: "API reference", icon: Braces },
  { id: "embed", label: "Embed", icon: Code2 },
  { id: "architecture", label: "Architecture", icon: Boxes },
  { id: "changelog", label: "Changelog", icon: GitBranch },
];

const quickstart = `# clone and run — no API key required
git clone https://github.com/tato10861-code/eidon.git
cd eidon
npm install
cp .env.example .env.local
npm run dev

# open http://localhost:3000`;

const envSnippet = `# Any OpenAI-compatible endpoint. Leave blank to use the demo engine.
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini

# Canonical URL for metadata, sitemap and embed snippets.
NEXT_PUBLIC_SITE_URL=http://localhost:3000`;

const curlSnippet = `curl -N ${siteUrl}/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "employeeId": "ava",
    "messages": [
      { "role": "user", "content": "Write a 4-step outbound sequence for a VP Engineering at a fintech." }
    ]
  }'`;

const embedSnippet = `<iframe
  src="${siteUrl}/embed/ava-sales-development"
  width="420"
  height="640"
  style="border:0;border-radius:24px"
  title="Ava — AI employee"
></iframe>`;

const streamSnippet = `data: {"type":"meta","model":"eidon-core · demo","mode":"demo"}
data: {"type":"trace","trace":{"type":"thought","label":"Reading context","detail":"Account research · Outbound sequences","status":"done"}}
data: {"type":"trace","trace":{"type":"tool","label":"crm.search","detail":"HubSpot · scoped read","status":"done"}}
data: {"type":"delta","text":"**Outbound sequence**\\n\\n"}
data: {"type":"done","usage":{"tokens":612,"latencyMs":1840}}`;

const employeesSnippet = `curl ${siteUrl}/api/employees`;

const healthSnippet = `curl ${siteUrl}/api/health
# { "status": "ok", "service": "eidon", "version": "0.1.0" }`;

const changelog = [
  {
    version: "v0.1.0",
    date: "Initial release",
    items: [
      "Twelve production-shaped AI employee profiles with skills, toolbelts, playbooks and quality bars.",
      "Provider-agnostic streaming runtime with a deterministic offline demo engine.",
      "Studio builder, playground, workforce analytics dashboard and embeddable widget.",
      "50-integration catalog with scoped permissions and search.",
      "English and Arabic marketing dictionaries with RTL support.",
      "CI, CodeQL, Dependabot, release automation and repository governance.",
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="container-page py-14">
      <div className="grid gap-10 lg:grid-cols-[210px_minmax(0,1fr)] xl:gap-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Eyebrow>Documentation</Eyebrow>
          <nav className="mt-5 flex flex-col gap-1" aria-label="Docs sections">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] text-fog transition-colors hover:bg-white/[0.04] hover:text-snow"
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {section.label}
                </a>
              );
            })}
          </nav>

          <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-fog/50">Version</p>
            <p className="mt-1.5 font-mono text-[11px] text-lime">v0.1.0 · early access</p>
            <a
              href="https://github.com/tato10861-code/eidon"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[10.5px] text-fog transition-colors hover:text-snow"
            >
              Repository
              <ArrowUpRight className="size-3" aria-hidden="true" />
            </a>
          </div>
        </aside>

        <div className="min-w-0">
          <header>
            <h1 className="font-display text-[clamp(2.4rem,5vw,3.8rem)] leading-none tracking-[-0.025em] text-snow">
              Build on <span className="italic text-lime">Eidon.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-fog">
              Everything you need to run an AI employee locally, call the streaming runtime, embed a
              widget and understand how the platform fits together.
            </p>
          </header>

          <section id="quickstart" className="scroll-mt-24 pt-14">
            <h2 className="font-display text-[28px] text-snow">Quickstart</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-fog">
              Eidon runs with zero configuration. With no key, every conversation uses the
              deterministic demo engine, so previews and local development never break.
            </p>
            <CodeBlock code={quickstart} language="bash" filename="terminal" className="mt-5" />
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {[
                { label: "Node", value: "22+" },
                { label: "Framework", value: "Next.js 16" },
                { label: "Package manager", value: "npm" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5"
                >
                  <p className="font-mono text-[9px] uppercase tracking-wider text-fog/50">
                    {item.label}
                  </p>
                  <p className="mt-1 text-[12px] text-mist">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="configuration" className="scroll-mt-24 pt-14">
            <h2 className="font-display text-[28px] text-snow">Configuration</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-fog">
              All environment variables are optional. Any OpenAI-compatible provider works: Azure
              OpenAI, Groq, Together, vLLM or Ollama.
            </p>
            <CodeBlock code={envSnippet} language="bash" filename=".env.local" className="mt-5" />
            <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="text-[12px] leading-relaxed text-fog">
                <span className="font-medium text-snow">Never commit secrets.</span>{" "}
                <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[10.5px] text-mist">
                  .env*
                </code>{" "}
                is ignored except{" "}
                <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[10.5px] text-mist">
                  .env.example
                </code>
                .
              </p>
            </div>
          </section>

          <section id="api" className="scroll-mt-24 pt-14">
            <h2 className="font-display text-[28px] text-snow">API reference</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-fog">
              The runtime is a single streaming endpoint. Traces arrive before the first token, then
              deltas stream as they are generated.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-[10px]">
              <span className="rounded-md border border-emerald-400/25 bg-emerald-400/[0.08] px-2 py-1 text-emerald-300">
                POST
              </span>
              <span className="text-mist">/api/chat</span>
              <span className="rounded-md border border-white/10 px-2 py-1 text-fog/60">
                text/event-stream
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.08]">
              <table className="w-full min-w-[520px] text-start">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] font-mono text-[9px] uppercase tracking-wider text-fog/50">
                    <th className="px-4 py-2.5 text-start font-normal">Field</th>
                    <th className="px-4 py-2.5 text-start font-normal">Type</th>
                    <th className="px-4 py-2.5 text-start font-normal">Required</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["employeeId", "string", "No — defaults to ava"],
                    ["messages", "ChatMessage[]", "Yes — last 24 kept"],
                    ["config", "Partial<EmployeeConfig>", "No — custom build"],
                  ].map((row) => (
                    <tr key={row[0]} className="border-b border-white/[0.04] last:border-0">
                      <td className="px-4 py-3 font-mono text-[11px] text-lime/80">{row[0]}</td>
                      <td className="px-4 py-3 font-mono text-[10.5px] text-mist">{row[1]}</td>
                      <td className="px-4 py-3 text-[11px] text-fog">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <CodeBlock code={curlSnippet} language="bash" filename="terminal" className="mt-4" />
            <CodeBlock code={streamSnippet} language="text" filename="stream" className="mt-4" />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2">
                  <Radio className="size-3.5 text-lime" aria-hidden="true" />
                  <p className="font-mono text-[9.5px] uppercase tracking-wider text-fog/60">
                    GET /api/employees
                  </p>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-fog">
                  Returns the full workforce with roles, skills and tools.
                </p>
                <CodeBlock code={employeesSnippet} language="bash" className="mt-3" />
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-lime" aria-hidden="true" />
                  <p className="font-mono text-[9.5px] uppercase tracking-wider text-fog/60">
                    GET /api/health
                  </p>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-fog">
                  Health probe for uptime checks and load balancers.
                </p>
                <CodeBlock code={healthSnippet} language="bash" className="mt-3" />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-4">
              <p className="text-[11.5px] leading-relaxed text-amber-100/90">
                <span className="font-medium">Rate limit:</span> 40 requests per minute per IP on
                the public demo. Production keys are provisioned per workspace. A 429 response
                includes <code className="font-mono text-[10px]">Retry-After</code>.
              </p>
            </div>
          </section>

          <section id="embed" className="scroll-mt-24 pt-14">
            <h2 className="font-display text-[28px] text-snow">Embed an employee</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-fog">
              Drop a frameable widget into any page. The embed is a minimal surface with no
              navigation, scoped to a single employee.
            </p>
            <CodeBlock code={embedSnippet} language="html" filename="embed.html" className="mt-5" />
            <p className="mt-3 text-[12px] leading-relaxed text-fog">
              Replace the slug with any employee from{" "}
              <Link href="/employees" className="text-lime underline underline-offset-2">
                the workforce
              </Link>
              , or publish a custom build from the studio.
            </p>
          </section>

          <section id="architecture" className="scroll-mt-24 pt-14">
            <h2 className="font-display text-[28px] text-snow">Architecture</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-fog">
              The runtime is provider-agnostic. Persona, skills, tools, guardrails and memory are
              resolved per request; the provider is interchangeable.
            </p>
            <pre className="mt-5 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#070910] p-5 font-mono text-[11px] leading-relaxed text-mist/85">
              {`Browser · embed · API client
            │
            ▼
Next.js 16 App Router (RSC + client islands)
            │
  /api/chat ──► rate limit ──► Eidon Core
                              ├─ persona
                              ├─ skills
                              ├─ tool router
                              ├─ guardrails
                              └─ provider
                                   ├─ OpenAI-compatible (streaming)
                                   └─ deterministic demo engine`}
            </pre>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                {
                  title: "Server components",
                  body: "Marketing and profiles render on the server. Client islands only where state is needed.",
                },
                {
                  title: "Streaming first",
                  body: "SSE traces, deltas and usage. No polling, no job queue for the demo path.",
                },
                {
                  title: "Zero lock-in",
                  body: "Bring any OpenAI-compatible endpoint, or run the deterministic engine offline.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
                >
                  <p className="text-[12px] font-medium text-snow">{item.title}</p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-fog">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="changelog" className="scroll-mt-24 pt-14">
            <h2 className="font-display text-[28px] text-snow">Changelog</h2>
            <div className="mt-5 flex flex-col gap-4">
              {changelog.map((release) => (
                <article
                  key={release.version}
                  className="rounded-[22px] border border-white/[0.08] bg-[#090c12]/70 p-5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-lime/25 bg-lime/[0.08] px-2.5 py-1 font-mono text-[10px] text-lime">
                      {release.version}
                    </span>
                    <span className="font-mono text-[10px] text-fog/55">{release.date}</span>
                  </div>
                  <ul className="mt-4 flex flex-col gap-2">
                    {release.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-lime/60" />
                        <span className="text-[12px] leading-relaxed text-mist/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <div className="mt-14 flex flex-col items-start justify-between gap-4 rounded-[22px] border border-white/[0.07] bg-white/[0.02] px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-[12px] text-fog">
              Missing something? Open an issue — we document what we ship.
            </p>
            <div className="flex gap-2">
              <Button
                href="https://github.com/tato10861-code/eidon/issues"
                variant="secondary"
                size="sm"
              >
                GitHub issues
              </Button>
              <Button href="/playground" size="sm">
                Try the runtime
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
