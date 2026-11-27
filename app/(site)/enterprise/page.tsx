import type { Metadata } from "next";
import {
  Brain,
  Building2,
  Code2,
  Database,
  FileJson,
  Globe,
  Key,
  Lock,
  Network,
  Paintbrush,
  Server,
  Shield,
  Sparkles,
  Webhook,
  Zap,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Enterprise & Licensing",
  description:
    "Deploy Eidon on your infrastructure, train AI on your data, or license the platform. White-label, VPC, and OEM options for AI companies.",
  alternates: { canonical: "/enterprise" },
};

const deploymentOptions = [
  {
    icon: Globe,
    title: "SaaS",
    description:
      "Full platform hosted by Eidon. Zero infrastructure, automatic updates, 99.99% SLA. Ideal for fast deployment.",
    highlight: false,
  },
  {
    icon: Server,
    title: "Private Cloud / VPC",
    description:
      "Deployed into your AWS, GCP or Azure VPC. Your data never leaves your perimeter. Bring your own AI model.",
    highlight: true,
  },
  {
    icon: Building2,
    title: "On-Premise",
    description:
      "Full source-code license. Run on your hardware, air-gapped if required. Suitable for government and regulated industries.",
    highlight: false,
  },
  {
    icon: Paintbrush,
    title: "White-Label OEM",
    description:
      "Re-brand Eidon as your own product. Custom domain, your logo, your pricing. Sell AI employees to your customers.",
    highlight: false,
  },
];

const enterpriseFeatures = [
  {
    icon: Key,
    title: "API key management",
    description:
      "Scoped API keys per workspace with rate limiting and usage tracking. Revoke, rotate and audit from one dashboard.",
  },
  {
    icon: Database,
    title: "Data residency & sovereignty",
    description:
      "Choose your database region. All conversation data stays inside the jurisdiction you specify.",
  },
  {
    icon: Lock,
    title: "SSO / SCIM",
    description:
      "Integrate with Okta, Azure AD or any SAML/OIDC provider. Automate provisioning and de-provisioning.",
  },
  {
    icon: Shield,
    title: "Audit logs",
    description:
      "Immutable log of every API call, authentication event and configuration change. Export to your SIEM.",
  },
  {
    icon: Webhook,
    title: "Webhooks & event streaming",
    description:
      "Real-time events for every conversation turn, tool call and employee state change. Kafka and SNS connectors available.",
  },
  {
    icon: Network,
    title: "Multi-tenant workspaces",
    description:
      "Serve multiple business units or customers from a single deployment, fully isolated at the data layer.",
  },
];

const aiTrainingFeatures = [
  {
    icon: FileJson,
    title: "JSONL export",
    description:
      "Every conversation is exportable as OpenAI-compatible JSONL for fine-tuning. Quality scores included.",
  },
  {
    icon: Brain,
    title: "Domain-specific corpora",
    description:
      "Filter exports by employee role, department, language or quality threshold to build targeted fine-tuning datasets.",
  },
  {
    icon: Code2,
    title: "Training pipeline integration",
    description:
      "Webhook-driven export triggers connect directly to your MLOps stack — Weights & Biases, MLflow, Hugging Face.",
  },
  {
    icon: Sparkles,
    title: "Proprietary data moat",
    description:
      "Conversations collected on your deployment belong to you. Eidon never trains on your data without explicit consent.",
  },
];

const faqs = [
  {
    q: "Can I train an AI model on conversations from my Eidon deployment?",
    a: "Yes. Every conversation exported from your deployment belongs to you. Use the /api/export endpoint to download JSONL files ready for fine-tuning with OpenAI, Anthropic, together.ai or any open-source framework. You can build a highly specialised model on the exact tasks your business runs.",
  },
  {
    q: "What does a white-label license cover?",
    a: "Full rebrand — your logo, domain and color palette. Remove all Eidon branding from the UI, emails and API responses. Sell the product under your own brand name with your own pricing. Resell, sublicense or embed in your own SaaS.",
  },
  {
    q: "Is the AI model included in the license?",
    a: "No. Eidon is model-agnostic: you bring your own API keys (OpenAI, Anthropic, Azure OpenAI, local LLM via OpenAI-compatible endpoint). The license covers the platform, not the underlying model costs.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You own your data. On cancellation we provide a full export of all conversations, configurations and employee profiles in standard formats. For on-premise deployments, the data never leaves your infrastructure.",
  },
  {
    q: "Is there a minimum contract for enterprise?",
    a: "Enterprise contracts start at 12 months. Volume discounts apply from $5k/month. Proof-of-concept licenses are available for 90 days.",
  },
];

export default function EnterprisePage() {
  return (
    <>
      {/* Hero */}
      <section className="container-page pb-16 pt-20">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>Enterprise & Licensing</Eyebrow>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              The AI employee platform
              <br />
              built to be licensed
            </h1>
            <p className="mt-5 text-lg text-mist/70">
              Deploy on your infrastructure, train AI models on your data, or embed Eidon inside
              your own product. Full source available.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" href="mailto:enterprise@eidon.ai">
                Talk to sales
              </Button>
              <Button size="lg" variant="ghost" href="/docs">
                Read the docs
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Deployment options */}
      <section className="container-page pb-20">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <SectionHeading eyebrow="Deployment" title="Your infrastructure, your rules" />
          </div>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {deploymentOptions.map((option) => (
            <Reveal key={option.title}>
              <div
                className={`flex flex-col gap-4 rounded-2xl border p-6 ${
                  option.highlight ? "border-lime/30 bg-lime/5" : "border-white/8 bg-white/[0.03]"
                }`}
              >
                <option.icon
                  className={`size-7 ${option.highlight ? "text-lime" : "text-mist/60"}`}
                />
                <div>
                  <h3 className="font-medium text-white">{option.title}</h3>
                  <p className="mt-2 text-sm text-mist/60 leading-relaxed">{option.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* AI training data section */}
      <section className="container-page pb-20">
        <div className="rounded-3xl border border-white/8 bg-white/[0.02] px-8 py-14">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <SectionHeading eyebrow="AI training" title="Your conversations become your model" />
              <p className="mt-4 text-mist/60">
                Every interaction your AI employees complete is a labeled, role-grounded training
                example. Export them to build a proprietary model fine-tuned on your exact business
                tasks — no data sharing required.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {aiTrainingFeatures.map((feature) => (
              <Reveal key={feature.title}>
                <div className="flex gap-4">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-lime/10">
                    <feature.icon className="size-4 text-lime" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{feature.title}</h4>
                    <p className="mt-1.5 text-sm text-mist/60 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 text-center">
            <div className="rounded-xl border border-white/8 bg-black/40 p-5 font-mono text-sm text-mist/70">
              <div className="mb-1 text-lime/80"># export conversations as fine-tuning data</div>
              <div>curl https://your-deployment.com/api/export \</div>
              <div className="pl-4">{"  "}-H "Authorization: Bearer ek_ws1234_..." \</div>
              <div className="pl-4">
                {"  "}"?format=jsonl&minQuality=4.5" --output training-data.jsonl
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Enterprise features grid */}
      <section className="container-page pb-20">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <SectionHeading
              eyebrow="Enterprise features"
              title="Everything a production deployment needs"
            />
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enterpriseFeatures.map((feature) => (
            <Reveal key={feature.title}>
              <div className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5">
                  <feature.icon className="size-4 text-mist/80" />
                </div>
                <div>
                  <h4 className="font-medium text-white">{feature.title}</h4>
                  <p className="mt-1.5 text-sm text-mist/60 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container-page pb-20">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <SectionHeading eyebrow="FAQ" title="Common questions" />
          </div>
        </Reveal>
        <div className="mx-auto mt-12 max-w-2xl divide-y divide-white/8">
          {faqs.map((faq) => (
            <Reveal key={faq.q}>
              <div className="py-6">
                <h4 className="font-medium text-white">{faq.q}</h4>
                <p className="mt-3 text-sm text-mist/60 leading-relaxed">{faq.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-24">
        <Reveal>
          <div className="rounded-3xl border border-lime/20 bg-lime/5 px-8 py-14 text-center">
            <Zap className="mx-auto mb-4 size-8 text-lime" />
            <h2 className="text-2xl font-semibold text-white">Ready to license Eidon?</h2>
            <p className="mt-3 text-mist/60">
              Tell us your use case and we'll scope a proof-of-concept within 48 hours.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" href="mailto:enterprise@eidon.ai">
                Get in touch
              </Button>
              <Button size="lg" variant="ghost" href="/pricing">
                See pricing
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
