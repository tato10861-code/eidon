import { getEmployeeById, employees } from "../employees";
import type { ChatMessage, EmployeeConfig, EmployeeTemplate, RoleId, TraceEvent } from "../types";
import { estimateTokens, sleep } from "../utils";

export type EngineEvent =
  | { type: "meta"; model: string; mode: "live" | "demo" }
  | { type: "trace"; trace: TraceEvent }
  | { type: "delta"; text: string }
  | { type: "done"; usage: { tokens: number; latencyMs: number } };

export interface EngineInput {
  employee: EmployeeTemplate;
  messages: Pick<ChatMessage, "role" | "content">[];
  config?: Partial<EmployeeConfig>;
}

const traceId = () => Math.random().toString(36).slice(2, 10);

export function buildSystemPrompt(employee: EmployeeTemplate, config?: Partial<EmployeeConfig>) {
  const name = config?.name?.trim() || employee.name;
  const company = config?.company?.trim();
  const tone = config?.tone ?? "precise";
  const mission = config?.mission?.trim();

  return [
    employee.systemPrompt,
    `Your name is ${name}. Your role is ${employee.title}.`,
    company ? `You work for ${company}.` : "",
    `Default tone: ${tone}. Be concise, specific and useful. Prefer concrete next steps over generic advice.`,
    mission ? `Current mission: ${mission}` : "",
    config?.knowledge?.length
      ? `Ground answers in this company knowledge. Quote it when relevant and say when it does not cover the question:\n${config.knowledge.map((item) => `- ${item}`).join("\n")}`
      : "",
    config?.guardrails?.length
      ? `Hard guardrails — never violate these:\n${config.guardrails.map((item) => `- ${item}`).join("\n")}`
      : "",
    "Never invent facts, prices, legal terms or commitments. If you are uncertain, state the assumption and escalate.",
    "Format with short markdown sections, bold labels and lists. Do not use tables.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function lastUserMessage(messages: EngineInput["messages"]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
}

function topicOf(question: string) {
  const cleaned = question
    .replace(/^(write|draft|create|build|design|help me|can you|please|i need|give me)\s+/i, "")
    .replace(/\s+/g, " ")
    .replace(/[?.!]+$/, "")
    .trim();
  if (!cleaned) return "the request";
  return cleaned.length > 92 ? `${cleaned.slice(0, 89)}…` : cleaned;
}

function pickTool(employee: EmployeeTemplate, question: string) {
  const q = question.toLowerCase();
  const match = employee.tools.find((tool) => {
    const haystack = `${tool.name} ${tool.category} ${tool.action}`.toLowerCase();
    if (/sql|query|cohort|retention|warehouse/.test(q))
      return /snowflake|bigquery|warehouse/.test(haystack);
    if (/refund|charge|billing|payment/.test(q)) return /stripe|billing|payment/.test(haystack);
    if (/ticket|support|customer/.test(q)) return /zendesk|intercom|support/.test(haystack);
    if (/candidate|screen|hire|recruit/.test(q)) return /greenhouse|linkedin|ats/.test(haystack);
    if (/code|bug|latency|deploy|test/.test(q)) return /github|sentry|datadog/.test(haystack);
    if (/contract|clause|nda|legal/.test(q)) return /docusign|ironclad|contract/.test(haystack);
    return false;
  });
  return match ?? employee.tools[0];
}

function tracesFor(employee: EmployeeTemplate, question: string): TraceEvent[] {
  const tool = pickTool(employee, question);
  return [
    {
      id: traceId(),
      type: "thought",
      label: "Reading context",
      detail: `${employee.skills.slice(0, 2).join(" · ")}`,
      status: "done",
    },
    {
      id: traceId(),
      type: "tool",
      label: tool.action,
      detail: `${tool.name} · scoped read`,
      status: "done",
    },
    {
      id: traceId(),
      type: "guardrail",
      label: "Policy check passed",
      detail: "0 violations · no PII in output",
      status: "done",
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Local demo composer                                                         */
/* -------------------------------------------------------------------------- */

interface Context {
  employee: EmployeeTemplate;
  config?: Partial<EmployeeConfig>;
  question: string;
  company: string;
  name: string;
}

function industryAngle(question: string) {
  const q = question.toLowerCase();
  if (/fintech|payment|bank|financial/.test(q))
    return {
      pain: "the security review that lands in the middle of every enterprise renewal",
      proof: "a payments team cut that review from six weeks to nine days",
      initiative: "the Series B hiring plan",
      subject: "the security review slowing your Series B hires",
    };
  if (/health|clinic|medical|patient/.test(q))
    return {
      pain: "the compliance evidence that never lives in one place",
      proof: "a clinic group cut audit prep from 30 hours to four",
      initiative: "the new patient platform",
      subject: "audit prep before your next rollout",
    };
  if (/commerce|retail|shop|ecommerce/.test(q))
    return {
      pain: "the peak-season handoffs that break between support and ops",
      proof: "a retail team cut peak-week escalations by 41%",
      initiative: "the peak-season plan",
      subject: "the Monday queue before peak season",
    };
  if (/ai|model|llm|agent/.test(q))
    return {
      pain: "the gap between a demo that works and a system you can put in front of customers",
      proof: "an AI team cut evaluation cycles from two weeks to two days",
      initiative: "the platform roadmap",
      subject: "shipping the model, not just demoing it",
    };
  return {
    pain: "the manual work that quietly eats a day every week",
    proof: "a team at your stage recovered 11 hours per person per month",
    initiative: "the next stage of growth",
    subject: "a thought on your next quarter",
  };
}

function salesReply(ctx: Context) {
  const q = ctx.question.toLowerCase();

  if (/sequence|outbound|cold|prospect|follow.?up|email|linkedin/.test(q)) {
    const angle = industryAngle(ctx.question);
    return `**Outbound sequence · ${topicOf(ctx.question)}**

**Goal:** one 20-minute conversation — not a demo. Four touches over 12 days, roughly 95 words each.

**1 · Day 1 — The wedge**
**Subject:** ${angle.subject}
Hi {first_name} —

${angle.initiative.charAt(0).toUpperCase() + angle.initiative.slice(1)} usually surfaces the same bottleneck: ${angle.pain}. ${angle.proof.charAt(0).toUpperCase() + angle.proof.slice(1)}.

We help teams remove that bottleneck without adding headcount. Worth a 20-minute look next week?

**2 · Day 4 — The proof**
**Subject:** Re: ${angle.subject}
{first_name} — one data point in case it is useful: ${angle.proof}. I can send the two-page teardown — no call needed. Want it?

**3 · Day 8 — The insight**
**Subject:** The part most teams miss
{first_name} — the teams that fix this usually do three things: instrument the handoff, give one owner the SLA, and remove the approval that adds no risk. I wrote up how a peer team sequenced it. Should I send the link?

**4 · Day 12 — The exit**
**Subject:** Closing the loop
{first_name} — I will stop here so I am not noise. If ${angle.pain} moves up the list, reply "later" and I will check back in 60 days. Either way, good luck with ${angle.initiative}.

**Before you send**
- Replace {first_name} and verify the trigger event is still true today.
- Keep one ask per message; never stack a call and a document request.
- Log the sequence in the CRM before the first send, not after.

**Next step:** load the four steps as a sequence, then personalise step 1 for the ten highest-fit accounts.`;
  }

  if (/expensive|price|pricing|cost|budget|discount|competitor|objection|cheaper/.test(q)) {
    return `**What they are actually saying**

"Too expensive" is rarely a price problem. It is usually one of three things: the value is not quantified, the budget is committed elsewhere, or price is being used to end the conversation politely. Diagnose before you discount — a discount you volunteer teaches them the price was never real.

**Reply — send-ready**
> Fair — "expensive" usually means the value is not obvious yet, and that is on me. The teams that buy this are replacing ${ctx.company === "your company" ? "a manual process" : "a process that costs them more than we do"}. If we cannot show payback inside 90 days, you should not buy it. Can I send a one-page model with your numbers, or should we park it until next quarter?

**Then ask**
> What would need to be true for this to be an obvious yes?

**If the objection is real**
- **Budget timing:** propose a smaller first scope with a fixed review date. Never fake urgency.
- **Competitor:** ask which alternative they are measuring against and on what criteria. Compete on outcome, not features.
- **No owner:** stop selling and help them find the person who feels the pain. A deal without an owner is a forecast, not a deal.

**Do not:** cut price on the first call, invent a discount that does not exist, or promise an ROI number you cannot defend.

**Next step:** send the one-page payback model, then book a 15-minute review of the assumptions — not another demo.`;
  }

  if (/qualif|lead|meddic|bant|discovery|budget|decision|evaluat/.test(q)) {
    return `**MEDDIC read · ${topicOf(ctx.question)}**

- **Metrics** — You have "ROI in 90 days", but not a number. *Ask:* "What does success look like in dollars or hours by day 90?"
- **Economic buyer** — Not identified yet. "Budget approved" is not the same as a named buyer. *Ask:* "Who signs, and what have they approved before?"
- **Decision criteria** — Three vendors are in play; criteria are still vague. *Ask:* "What would make you choose one of the other two?"
- **Decision process** — Unknown. *Ask:* "Walk me through the last purchase like this — who touched it and how long did it take?"
- **Identify pain** — Strong: 200 employees implies real operational load. *Ask:* "What breaks first if nothing changes this quarter?"
- **Champion** — Unclear. *Ask:* "Who internally is pushing for this when you are not in the room?"

**Verdict:** qualified enough for a discovery call, not enough to forecast. Two gaps block a proposal: economic buyer and champion.

**Book it if:** the buyer is named and the pain has a cost.
**Do not book yet if:** "budget approved" has no owner and no number.

**Next step:** send a 3-question pre-call note that names the two gaps, then book 25 minutes with the champion.`;
  }

  return `**Account plan · ${topicOf(ctx.question)}**

**Hypothesis:** the sharpest wedge is ${industryAngle(ctx.question).pain}. Lead with the cost of the current workaround, not the feature.

**20-minute discovery agenda**
1. **Situation (3 min):** "How does this work today, and who owns it?"
2. **Impact (5 min):** "What does it cost when it breaks — time, revenue or risk?"
3. **Priority (3 min):** "Why now, and what happens if it waits a quarter?"
4. **Process (4 min):** "Who else needs to say yes, and how did the last purchase like this go?"
5. **Next step (3 min):** agree on one concrete action with a date.

**Five questions worth asking**
- What is the last thing you tried, and why did it stop?
- Where does this break at 2× the volume?
- Who feels the pain weekly, and who feels it only at renewal?
- What would make this a "no" even if the product worked?
- What is the cost of waiting one quarter?

**Next step:** book the discovery call and send the agenda in advance — it doubles show-up quality.`;
}

function analystReply(ctx: Context) {
  const q = ctx.question.toLowerCase();
  const dialect = /bigquery|bq/.test(q)
    ? "BigQuery"
    : /postgres|postgresql/.test(q)
      ? "PostgreSQL"
      : "Snowflake";
  const week =
    dialect === "BigQuery" ? "date_trunc(created_at, week)" : "date_trunc('week', created_at)";

  if (/sql|query|retention|cohort|join|cte|write/.test(q)) {
    return `**Weekly retention by signup cohort · ${dialect}**

**Assumptions:** one row per user in \`app.users\`; activity is \`session_started\`; weeks start Monday; the table is event-level.

\`\`\`sql
-- Cohort retention: % of each signup cohort active in week N
with first_seen as (
  select
    user_id,
    ${week} as cohort_week
  from app.users
  group by 1
),

activity as (
  select distinct
    user_id,
    date_trunc('week', occurred_at) as activity_week
  from app.events
  where event_name = 'session_started'
),

cohort_activity as (
  select
    f.cohort_week,
    datediff('week', f.cohort_week, a.activity_week) as week_number,
    count(distinct a.user_id) as active_users
  from first_seen f
  join activity a using (user_id)
  where a.activity_week >= f.cohort_week
  group by 1, 2
),

cohort_size as (
  select cohort_week, count(distinct user_id) as users
  from first_seen
  group by 1
)

select
  c.cohort_week,
  c.week_number,
  c.active_users,
  s.users as cohort_users,
  round(c.active_users / nullif(s.users, 0), 3) as retention_rate
from cohort_activity c
join cohort_size s using (cohort_week)
order by c.cohort_week, c.week_number;
\`\`\`

**Validate before you trust it**
\`\`\`sql
-- 1. cohort sizes must sum to your signup count
select count(*) from app.users;

-- 2. no activity before signup
select count(*) from app.events e
join app.users u using (user_id)
where e.occurred_at < u.created_at;
\`\`\`

**Read it this way:** week 0 is 100% by construction. Compare week 4 across cohorts, not week 1 — early activity is dominated by onboarding.

**Next step:** run the two validation queries, then pivot week_number into columns in your BI layer.`;
  }

  if (/drop|declin|anomal|why|investigat|spike|fell|down/.test(q)) {
    return `**Investigation plan · ${topicOf(ctx.question)}**

**1. Confirm the drop is real, not a denominator artifact**
Check whether signups, eligible users or the activation window changed. An 8% drop is often a 12% traffic mix shift.

\`\`\`sql
select
  date_trunc('day', created_at) as day,
  count(*) as signups,
  count_if(activated_at is not null) as activated,
  round(count_if(activated_at is not null) / count(*), 3) as activation_rate
from app.users
where created_at >= dateadd('day', -35, current_date)
group by 1
order by 1 desc;
\`\`\`

**2. Segment before you theorise**
Cut by acquisition channel, platform, plan, geography and app version. A single segment moving 40% explains a blended 8%.

**3. Rule out instrumentation**
Did the event name, SDK version or tracking consent change? Compare event volume per session, not just absolute counts.

**4. Test the three most likely hypotheses**
- **Mix shift:** a new campaign sends lower-intent traffic.
- **Product change:** a step in onboarding shipped in the same window.
- **Latency or reliability:** activation events failing to fire.

**5. Apply a decision rule**
If the drop disappears within one segment → fix the source. If it holds across segments → treat it as a product regression and escalate with the segment table, not a single number.

**What I need from you:** the activation definition, the exact date window and the deploy log for that week.

**Next step:** run query 1, then send me the segment table and I will narrow it to one cause.`;
  }

  if (/nrr|retention|metric|definition|explain|executive|non.?technical/.test(q)) {
    return `**Net revenue retention, in one sentence**

NRR answers: *if we sold nothing new next year, how much of this year's recurring revenue would survive and grow?*

**The formula**
> NRR = (starting MRR + expansion − contraction − churn) ÷ starting MRR

**Worked example**
Start with $1,000,000 MRR. Customers expand by $120,000, downgrade by $30,000, and churn $80,000.
> ($1,000,000 + $120,000 − $30,000 − $80,000) ÷ $1,000,000 = **101%**

**What it is not:** NRR excludes new customers. That is gross revenue retention plus new business — a different question.

**Why executives care:** above 100% means the installed base grows without sales spend. Below 100% means you are filling a leaky bucket.

**The paragraph for your board deck**
> Net revenue retention was 101% this quarter, meaning the existing customer base grew slightly without new logos. Expansion offset churn and contraction; the risk is concentrated in the mid-market cohort, where two accounts represent most of the contraction. The plan is to move those accounts to annual contracts and add a success motion before renewal.

**Next step:** define the cohort and time window, then reconcile the number to finance's MRR bridge before it goes in the deck.`;
  }

  return `**Analysis plan · ${topicOf(ctx.question)}**

**Decision this informs:** what changes if the number is higher or lower than expected?

**Metric contract**
- Definition, grain, time window and exclusions — write them before querying.
- Owner: who signs off on this definition?

**Steps**
1. Profile the source: row count, nulls, duplicates, timezone, late arrivals.
2. Build the logic in a CTE with one row per entity per period.
3. Validate with an independent count and a known total.
4. Segment the result before drawing a conclusion.
5. Write the so-what in one paragraph with a confidence level.

**Sanity checks**
- Does the total reconcile to a trusted source?
- Does the trend survive a change in date window?
- Would a 10% error change the decision?

**Next step:** send me the table names and the decision you are making — I will return the query and the validation set.`;
}

function supportReply(ctx: Context) {
  const q = ctx.question.toLowerCase();

  if (/refund|charged|billing|invoice|double|payment/.test(q)) {
    return `**Resolution path**

1. **Verify before promising.** Pull the charge in Stripe, confirm the duplicate, and check the refund window. Two charges on the same card, same amount, within minutes is almost always a retry — not fraud.
2. **Decide against policy, not mood.** If the duplicate is confirmed, refund the second charge in full and keep the subscription active.
3. **Tell the customer exactly what happens and when.** "Refunded today, 3–5 business days depending on your bank."

**Reply — send-ready**
> Hi {first_name},
>
> I am sorry — you were charged twice, and that is on us. I have confirmed the duplicate and refunded the second charge in full; it should appear in 3–5 business days depending on your bank. Your subscription stays active, and I have added a note to the account so this does not repeat.
>
> If the refund has not landed by {date}, reply here and I will escalate it personally.

**Policy note:** if the second charge is outside the refund window, do not improvise. Escalate to billing with the charge IDs and the customer's timeline.

**Escalate if:** the customer disputes both charges, mentions a chargeback, or the account shows three or more payment attempts.

**Next step:** confirm the refund ID in the ticket before sending.`;
  }

  if (/angry|furious|upset|complaint|escalat|frustrat|bad review/.test(q)) {
    return `**De-escalation · ${topicOf(ctx.question)}**

**First, name the impact — not the policy.**
The customer does not need an apology for the inconvenience; they need acknowledgment that the thing they lost was real.

**Reply — send-ready**
> Hi {first_name},
>
> You are right to be frustrated. You lost {time/money/trust}, and my first reply did not take that seriously. I have read the full thread and here is what I am doing: {specific action}, owned by me, by {time}.
>
> I cannot undo the delay, but I can make sure you are not the one chasing it. I will update you at {time} even if there is nothing new.

**Then, in the ticket**
- Restate the impact in one sentence.
- Name the owner and the next update time.
- Remove any internal jargon or blame.
- If money is involved, state the amount and the date — never "soon".

**Do not:** lead with policy, ask them to calm down, or promise a timeline you do not control.

**Escalate if:** the customer requests a manager, mentions legal action, or the issue affects other accounts.

**Next step:** send the reply, set the follow-up reminder, and log the root cause — not just the resolution.`;
  }

  if (/macro|password|reset|how.?to|template|faq/.test(q)) {
    return `**Macro · Password reset**

**When to use:** the customer cannot sign in and the account exists. Do not use for suspected compromise — that is a security escalation.

**Reply**
> Hi {first_name},
>
> I can get you back in. I have just sent a reset link to {email}; it expires in 30 minutes. If it does not arrive, check spam for a message from no-reply@, then reply here and I will trigger it manually.
>
> If you see "link expired", open the newest email — older links stop working once a new one is sent.

**Internal steps**
1. Confirm the account email and the last successful login.
2. Trigger the reset from the admin panel; do not ask for the password.
3. If the email bounces, verify the address before changing it.

**Escalate if:** MFA is lost, the email is inaccessible, or there are signs of account takeover.

**Next step:** save this as a macro with the two variables, then link it to the password-reset intent.`;
  }

  return `**Ticket plan · ${topicOf(ctx.question)}**

**Triage**
- **Impact:** who is blocked, and what can they not do?
- **Severity:** outage, degraded, or question? Severity drives the SLA, not the tone.
- **Owner:** the person who can actually fix it — not the person who received it.

**Response shape**
1. Acknowledge the impact in one sentence.
2. State what you have verified, not what you assume.
3. Give the next action, the owner and the time.
4. Close with the one thing that prevents a repeat contact.

**Escalate if:** revenue is blocked, data is exposed, or the customer asks for a human.

**Next step:** confirm the account and entitlement, then send the first response within the SLA.`;
}

function recruiterReply(ctx: Context) {
  const q = ctx.question.toLowerCase();

  if (/scorecard|rubric|interview|loop|hiring plan/.test(q)) {
    return `**Scorecard · ${topicOf(ctx.question)}**

**What this hire owns:** the outcome, not the ticket queue. Write it as one sentence the hiring manager signs.

**Signals (weighted)**
1. **Technical depth — 30%** — Can they reason about trade-offs without reciting a framework?
2. **Scope & ownership — 25%** — Have they carried a problem from ambiguity to production?
3. **Collaboration — 20%** — Do they make the people around them better? Ask for a concrete disagreement.
4. **Execution — 15%** — Evidence of shipping under real constraints, not perfect conditions.
5. **Growth — 10%** — What did they learn from the last thing that failed?

**Interview loop (4 stages)**
- **Screen (30 min):** motivation, scope, one technical deep-dive.
- **Technical (60 min):** a real problem from your codebase, not a puzzle.
- **System design (60 min):** ambiguous requirements, explicit trade-offs.
- **Values (30 min):** collaboration and feedback, with evidence.

**Red flags**
- Credits every success to "we" and every failure to circumstances.
- Cannot name a trade-off they got wrong.
- Optimises for the interviewer's approval instead of the problem.

**Calibration rule:** score independently before the debrief. Discussion before scoring produces consensus, not signal.

**Next step:** have the hiring manager approve the scorecard before the first interview.`;
  }

  if (/screen|profile|candidate|cv|resume|evaluate/.test(q)) {
    return `**Screen read · ${topicOf(ctx.question)}**

**Evidence on the table**
- 6 years of Go — depth in one language, which is useful but not the same as system ownership.
- Led payments — regulated, high-blast-radius work. Strong signal for judgment.
- No Kubernetes — a gap only if the team expects them to own the platform on day one.

**Assessment**
- **Strength:** payments experience implies correctness, auditability and incident discipline.
- **Gap:** container orchestration. Ask whether they have operated production systems through another abstraction.
- **Risk:** "led" can mean tech lead or people manager. Clarify scope before the technical screen.

**Verdict:** advance to a technical screen — with one adjustment. Replace the Kubernetes question with a system-design prompt about a payment retry path.

**Next question:** "Tell me about a payment failure you owned end to end. What did you change afterwards?"

**Do not:** reject for a missing tool. Reject for missing judgment, and record the evidence.

**Next step:** send the candidate a 30-minute screen invite and the interview focus areas.`;
  }

  if (/outreach|message|source|passive|inmail|linkedin/.test(q)) {
    return `**Outreach · ${topicOf(ctx.question)}**

**Principle:** write like a person who did the reading, not a recruiter working a list.

**Subject:** the thing you noticed
> Hi {first_name} — I saw you led the migration to {system} at {company}. I am not going to pretend this is a coincidence: we are building {what}, and that experience is unusually relevant.

**Body**
> The role owns {outcome}, not {task}. The team is {size}, the hard part is {real constraint}, and the person in this seat will have {authority}.
>
> If you are open to a 20-minute conversation, I will send the role brief first so you can decide whether it is worth your time. If not, no follow-up.

**Why this works**
- It names a specific, verifiable detail.
- It sells the problem, not the perks.
- It gives an easy, dignified exit.

**Follow-up (day 5):** one line — "Closing the loop on this; happy to send the brief either way."

**Do not:** claim you "came across their profile", promise remote without approval, or send a job description as the first message.

**Next step:** personalise the first line for the top ten candidates, then load the sequence into the ATS.`;
  }

  return `**Hiring plan · ${topicOf(ctx.question)}**

**Define the outcome first**
One sentence: what will be different in 12 months because this person exists?

**Then the signals**
- Three predictors of that outcome, each observable in an interview.
- Two anti-signals that look impressive but do not predict success here.

**Process**
1. Intake with the hiring manager: outcome, constraints, non-negotiables.
2. Calibrated scorecard before sourcing.
3. Structured screen with the same questions for every candidate.
4. Independent scoring, then debrief.
5. Offer with a clear scope and a 30-day plan.

**Pipeline math:** to hire one senior engineer, plan for 60 sourced, 18 screens, 6 onsites and 2 finalists. If the top of the funnel is smaller, the role is not realistic.

**Next step:** book the intake and leave with a signed scorecard — not a job description.`;
}

function specialistReply(ctx: Context) {
  const { employee, question, company } = ctx;
  const q = question.toLowerCase();
  const topic = topicOf(question);

  const artifacts: Partial<Record<RoleId, string>> = {
    marketing: `**Angle**
Most buyers do not need another ${/launch|feature/.test(q) ? "feature announcement" : "category entry"}; they need the outcome the current workaround cannot give them. Lead with the cost of the workaround, not the capability.

**Positioning line**
> For teams who ${/cac|acquisition|pipeline/.test(q) ? "are paying more for every qualified lead" : "still do this manually"}, ${company} is the ${/launch|feature/.test(q) ? "launch" : "platform"} that ${/cac|acquisition/.test(q) ? "turns existing demand into pipeline" : "removes the handoff entirely"} — without adding headcount.

**Three hooks**
1. "The metric moved. The process did not."
2. "You do not have a traffic problem. You have a handoff problem."
3. "What would you ship if approval took one hour?"

**30-day plan**
- **Week 1:** interview five customers, lock the angle, write the proof page.
- **Week 2:** ship the anchor asset and three distribution cuts.
- **Week 3:** launch the experiment with one channel and one metric.
- **Week 4:** kill or double; write the post-mortem either way.

**Measure:** qualified pipeline per $1k spent, not impressions.

**Next step:** pick the one belief the campaign must change, then brief the asset around it.`,
    finance: `**Model structure**
1. **Drivers** — customers, ARPU, churn, headcount, cost per hire.
2. **P&L** — revenue build, gross margin, opex by function.
3. **Cash** — collections, payroll, capex, runway.
4. **Scenarios** — base, upside, downside with explicit triggers.

**Assumptions to lock**
- Revenue recognition and the definition of ARR.
- Hiring plan timing, fully-loaded cost and ramp.
- Churn cohort and expansion rate, sourced from the last four quarters.

**Variance questions**
- Is the change price, volume, mix or timing?
- Does it repeat next month, or is it a one-off?
- Which line item absorbs it in the full-year view?

**Board paragraph**
> Revenue grew 6% while gross margin contracted 4 points. The margin movement is driven by mix — two enterprise deals with higher infrastructure and support costs — not by pricing. We expect the effect to persist for two quarters; the mitigation is a repricing review in the enterprise tier.

**Guardrail:** every input traceable to the ledger; every forecast labelled.

**Next step:** send me the actuals and the current plan, and I will return the variance bridge with the three questions to answer before the board pack.`,
    legal: `**Issue spot · ${topic}**

- **Obligation:** what must each party do, by when, and at what standard?
- **Remedy:** what happens if they do not — termination, credit, indemnity?
- **Exit:** can either side leave, on what notice, and what survives?
- **Liability:** is it capped, excluded, or unlimited?
- **Data:** where does it live, who processes it, and what happens on termination?

**Ask for**
- The full executed agreement, not the summary.
- The order form and any policy incorporated by reference.
- The counterparty's jurisdiction and entity name.

**Escalate**
Any unlimited liability, indemnity for third-party claims, exclusivity, or auto-renewal longer than 12 months goes to counsel with a one-paragraph brief.

> Iris is a contract review assistant, not legal advice. Material terms require qualified counsel.

**Next step:** send the clause and the governing law — I will return the issue list with proposed language and a risk rating.`,
    operations: `**SOP · ${topic}**

**Purpose:** one outcome, one owner, one definition of done.
**Trigger:** the event that starts the process.
**Owner:** the role accountable for the result — not the team.

**Steps**
1. **Intake** — capture the request, the requester and the deadline.
2. **Triage** — severity, dependencies, and the person who can unblock it.
3. **Execute** — the smallest set of steps that produces the outcome.
4. **Verify** — the check that proves it worked.
5. **Close** — update the record and the requester in one message.

**SLA**
- First response: 4 business hours.
- Resolution: 2 business days for standard, 4 hours for blocking.
- Escalation: after one missed SLA, to the named owner.

**RACI**
- Accountable: process owner.
- Responsible: operator on shift.
- Consulted: the team that owns the dependency.
- Informed: requester and the weekly cadence.

**Next step:** name the owner and the first SLA, then run the process manually once before automating it.`,
    product: `**PRD · ${topic}**

**Problem**
Who is blocked, what are they trying to do, and what happens today instead? Cite the evidence: tickets, interviews, funnel data.

**Evidence**
- Three user quotes with source and date.
- One quantified signal (drop-off, time lost, tickets per week).

**Non-goals**
- What this explicitly does not solve — protects scope and expectations.

**Proposed solution**
The smallest flow that proves the outcome. One primary path, one edge case, one failure state.

**Acceptance criteria**
- Given {context}, when {action}, then {observable result}.
- Given {failure}, the user sees {message} and can {recovery}.
- The event {name} fires with {properties}.

**Risks**
- Adoption, migration, support load, and the metric that will tell you first.

**Next step:** review the problem statement with design and engineering before writing the solution section.`,
    engineering: `**Debug plan · ${topic}**

**1. Reproduce**
Capture the smallest input, the environment and the exact version. If you cannot reproduce it, you do not understand it yet.

**2. Bound the blast radius**
When did it start? Which routes, tenants or regions? Compare a good request and a bad one at the same timestamp.

**3. Form one hypothesis at a time**
Latency doubled after deploy → check connection pool saturation, N+1 queries, a synchronous call added to the hot path, and a cache key change. Instrument before editing.

**4. Patch the smallest surface**
Add the failing test first. Fix the cause, not the symptom. Keep the diff reviewable.

**5. Verify and roll back safely**
Canary the change, watch p95 and error rate, and keep the previous build warm.

**Checks**
- No secrets in logs or traces.
- The fix has a test that fails before and passes after.
- The migration or breaking change is called out explicitly.

**Next step:** send me the stack trace, the deploy diff and the p95 graph — I will narrow it to one hypothesis.`,
    executive: `**Brief · ${topic}**

**The three things that matter**
1. **Decision needed:** what only you can decide, and by when.
2. **Risk:** the item that gets worse if it waits.
3. **Opportunity:** the item that gets more expensive if it waits.

**Calendar**
- Protect one 90-minute deep-work block before 11:00.
- Group external calls after 14:00.
- Decline or delegate anything without a decision in the invite.

**Follow-ups**
- Every commitment gets an owner and a date.
- Anything older than seven days gets closed, delegated or killed.

**Draft reply for the urgent thread**
> Thanks — I have read it. I can decide by {date}, but I need {missing input} first. If that is not available, the default is {safe default}.

**Next step:** send me the inbox export or the meeting list, and I will return the triage with the three decisions.`,
    success: `**30-60-90 · ${topic}**

**Days 0–30 — Prove the outcome**
- Confirm the executive sponsor and the success metric in writing.
- Instrument the two events that prove value.
- Ship one quick win the customer can show internally.

**Days 31–60 — Embed the habit**
- Weekly usage review with the champion.
- Remove one workflow friction per week.
- Identify the two teams that should expand next.

**Days 61–90 — Expand**
- Business review: outcome, gap, plan, ask.
- Expansion hypothesis with a named owner.
- Renewal readiness score and the risk log.

**Health signals**
- Weekly active seats, not logins.
- Time to first value, and the trend.
- Support tickets per 100 users.
- Champion engagement in the last 14 days.

**Risk play**
If usage drops more than 30%: call the champion within 24 hours, diagnose whether it is adoption, a broken workflow or a sponsor change, and bring a specific save plan — not a check-in.

**Next step:** send me the account's usage and last three touchpoints, and I will return the plan with the risk call.`,
  };

  const artifact =
    artifacts[employee.role] ??
    `**Working draft**

${employee.playbook.deliverable} for "${topic}".

- Start from the decision this work informs.
- Make the smallest set of assumptions explicit.
- Produce one artefact someone can act on today.

**Next step:** confirm the audience and the deadline, then I will produce the full deliverable.`;

  return `${artifact}

**Quality check**
${employee.playbook.checks.map((check) => `- ${check}`).join("\n")}`;
}

function composeReply(ctx: Context) {
  switch (ctx.employee.role) {
    case "sales":
      return salesReply(ctx);
    case "analyst":
      return analystReply(ctx);
    case "support":
      return supportReply(ctx);
    case "recruiter":
      return recruiterReply(ctx);
    default:
      return specialistReply(ctx);
  }
}

/* -------------------------------------------------------------------------- */
/* Runtime                                                                     */
/* -------------------------------------------------------------------------- */

async function* streamLocal(
  employee: EmployeeTemplate,
  messages: EngineInput["messages"],
  config?: Partial<EmployeeConfig>,
): AsyncGenerator<EngineEvent> {
  const startedAt = Date.now();
  const question = lastUserMessage(messages);

  yield { type: "meta", model: "eidon-core · demo", mode: "demo" };

  const traces = tracesFor(employee, question);
  for (const trace of traces) {
    yield { type: "trace", trace };
    await sleep(140);
  }

  const reply = composeReply({
    employee,
    config,
    question,
    name: config?.name?.trim() || employee.name,
    company: config?.company?.trim() || "your company",
  });

  const words = reply.split(/(\s+)/);
  let buffer = "";
  let emitted = 0;

  for (const token of words) {
    buffer += token;
    emitted += 1;
    if (emitted % 4 === 0) {
      yield { type: "delta", text: buffer };
      buffer = "";
      await sleep(14);
    }
  }
  if (buffer) yield { type: "delta", text: buffer };

  yield {
    type: "done",
    usage: { tokens: estimateTokens(reply), latencyMs: Date.now() - startedAt },
  };
}

async function* streamProvider(
  employee: EmployeeTemplate,
  messages: EngineInput["messages"],
  config?: Partial<EmployeeConfig>,
): AsyncGenerator<EngineEvent> {
  const startedAt = Date.now();
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  if (!apiKey) {
    yield* streamLocal(employee, messages, config);
    return;
  }

  yield { type: "meta", model, mode: "live" };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: Math.min(1, Math.max(0, (config?.creativity ?? 30) / 100)),
      messages: [
        { role: "system", content: buildSystemPrompt(employee, config) },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
    }),
  });

  if (!response.ok || !response.body) {
    yield {
      type: "trace",
      trace: {
        id: traceId(),
        type: "thought",
        label: "Provider unavailable",
        detail: "Falling back to the demo engine",
        status: "done",
      },
    };
    yield* streamLocal(employee, messages, config);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const payload = JSON.parse(data);
        const delta: string | undefined = payload.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          yield { type: "delta", text: delta };
        }
      } catch {
        // Ignore malformed keep-alive frames.
      }
    }
  }

  yield {
    type: "done",
    usage: { tokens: estimateTokens(full), latencyMs: Date.now() - startedAt },
  };
}

export async function* runEmployee({
  employee,
  messages,
  config,
}: EngineInput): AsyncGenerator<EngineEvent> {
  try {
    if (process.env.OPENAI_API_KEY) {
      yield* streamProvider(employee, messages, config);
    } else {
      yield* streamLocal(employee, messages, config);
    }
  } catch {
    yield* streamLocal(employee, messages, config);
  }
}

export function resolveEmployee(employeeId: string, config?: Partial<EmployeeConfig>) {
  const base = getEmployeeById(employeeId) ?? employees[0];

  if (!config) return base;

  return {
    ...base,
    name: config.name?.trim() || base.name,
    role: (config.role ?? base.role) as RoleId,
    title: base.title,
    accent: base.accent,
    accentSoft: base.accentSoft,
    skills: config.skills?.length ? config.skills : base.skills,
    tools: config.tools?.length
      ? config.tools.map((name) => ({
          name,
          category: "Connected",
          action: `${name.toLowerCase().replace(/\s+/g, ".")}.run`,
        }))
      : base.tools,
    systemPrompt: config.mission
      ? `${base.systemPrompt}\n\nMission: ${config.mission}`
      : base.systemPrompt,
  } satisfies EmployeeTemplate;
}
