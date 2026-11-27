# Eidon Licensing Guide

Eidon is available under three distinct licensing tiers designed for
different buyer types.

---

## Open-source (MIT)

The core platform code in this repository is available under the
[MIT License](LICENSE). You may use it freely for personal projects,
internal tooling or as a base for your own SaaS.

**What it covers:** full source, all AI employee profiles, the demo
engine, CI/CD pipelines, the design system.  
**What it does not cover:** Eidon's proprietary evaluation pipeline,
premium integrations and the hosted API inference layer.

---

## Commercial license

For companies deploying Eidon in production, distributing it to
customers, or building on the proprietary components:

| Tier                | Use case                                | Pricing        |
| ------------------- | --------------------------------------- | -------------- |
| **Startup**         | Up to 5 workspaces, SaaS                | $499 / month   |
| **Scale**           | Up to 50 workspaces, SaaS or VPC        | $2,499 / month |
| **Enterprise**      | Unlimited workspaces, VPC or on-premise | Custom         |
| **White-Label OEM** | Rebrand and resell                      | Revenue-share  |

A signed Order Form is required. See [`COMMERCIAL_LICENSE.md`](COMMERCIAL_LICENSE.md).

---

## AI training data licensing

Eidon's platform is architecturally designed to produce high-quality,
labeled fine-tuning data as a natural by-product of operation.

### What makes Eidon data valuable for AI companies

- **Role-grounded conversations** — each message is linked to a
  well-defined job function (sales, legal, engineering, finance…) with
  explicit system prompts, evaluation criteria and quality scores.
- **Tool-use traces** — every tool call, decision branch and reasoning
  step is captured in a structured trace. Ideal for training function-
  calling and agent models.
- **Multi-domain coverage** — 12 built-in employee roles across Revenue,
  Operations, Legal, Engineering and Executive domains. Add custom
  employees to extend coverage.
- **Arabic / English bilingual** — built-in bilingual support for MENA
  market deployment and multilingual fine-tuning.
- **Quality-scored** — each conversation turn carries a quality score
  based on playbook adherence, so you can filter for high-confidence
  training examples.

### Export formats

| Format | Endpoint                       | Description                   |
| ------ | ------------------------------ | ----------------------------- |
| JSONL  | `GET /api/export?format=jsonl` | OpenAI fine-tuning format     |
| JSON   | `GET /api/export?format=json`  | Structured JSON with metadata |

**Filter parameters:**

- `minQuality=4.5` — only high-confidence examples
- `since=2026-01-01` — date range
- `role=sales` — by employee role
- `department=Revenue` — by department

### Shared training programme

Licensees may opt into the Eidon Shared Training Programme (see
Section 4 of the Commercial License) to exchange anonymised data for a
15% license discount and priority capacity.

---

## Requesting a license

Email **enterprise@eidon.ai** with:

1. Your company name and use case.
2. Expected workspace count and monthly conversation volume.
3. Deployment preference (SaaS / VPC / on-premise / white-label).
4. Whether AI training data licensing is of interest.

We respond within 1 business day.
