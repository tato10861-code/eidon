export interface ToolMeta {
  name: string;
  category:
    | "CRM"
    | "Support"
    | "Data"
    | "Communication"
    | "Productivity"
    | "Finance"
    | "Recruiting"
    | "Engineering"
    | "Marketing"
    | "Commerce";
  description: string;
  scopes: string[];
  status: "ga" | "beta";
  color: string;
}

export const toolCatalog: ToolMeta[] = [
  // CRM
  {
    name: "HubSpot",
    category: "CRM",
    description: "Contacts, deals, sequences and lifecycle stages.",
    scopes: ["crm.objects.read", "crm.objects.write"],
    status: "ga",
    color: "#FF7A59",
  },
  {
    name: "Salesforce",
    category: "CRM",
    description: "Accounts, opportunities, activities and custom objects.",
    scopes: ["api", "refresh_token"],
    status: "ga",
    color: "#00A1E0",
  },
  {
    name: "Pipedrive",
    category: "CRM",
    description: "Pipeline stages, lead routing and activity tracking.",
    scopes: ["deals:read", "deals:write"],
    status: "ga",
    color: "#1A1A1A",
  },
  {
    name: "Attio",
    category: "CRM",
    description: "Modern CRM records, lists and workflow triggers.",
    scopes: ["records:read", "records:write"],
    status: "beta",
    color: "#6E56CF",
  },

  // Support
  {
    name: "Zendesk",
    category: "Support",
    description: "Tickets, macros, SLA policies and satisfaction data.",
    scopes: ["tickets:read", "tickets:write"],
    status: "ga",
    color: "#03363D",
  },
  {
    name: "Intercom",
    category: "Support",
    description: "Live conversations, help centre and customer attributes.",
    scopes: ["conversations:read", "conversations:write"],
    status: "ga",
    color: "#286EFA",
  },
  {
    name: "Freshdesk",
    category: "Support",
    description: "Ticket fields, groups, automations and CSAT.",
    scopes: ["tickets:read", "contacts:read"],
    status: "ga",
    color: "#25C16F",
  },
  {
    name: "WhatsApp Business",
    category: "Support",
    description: "Template messages, 24-hour sessions and media.",
    scopes: ["messages:send", "messages:read"],
    status: "ga",
    color: "#25D366",
  },

  // Data
  {
    name: "Snowflake",
    category: "Data",
    description: "Warehouse queries with role-scoped read access.",
    scopes: ["warehouse:read"],
    status: "ga",
    color: "#29B5E8",
  },
  {
    name: "BigQuery",
    category: "Data",
    description: "Datasets, scheduled queries and dry-run validation.",
    scopes: ["bigquery.readonly"],
    status: "ga",
    color: "#4285F4",
  },
  {
    name: "dbt",
    category: "Data",
    description: "Model lineage, test results and compiled SQL.",
    scopes: ["models:read", "runs:read"],
    status: "ga",
    color: "#FF694B",
  },
  {
    name: "Looker",
    category: "Data",
    description: "Looks, dashboards and governed metric definitions.",
    scopes: ["dashboards:read"],
    status: "ga",
    color: "#5C6BC0",
  },
  {
    name: "Databricks",
    category: "Data",
    description: "Notebook execution and Unity Catalog metadata.",
    scopes: ["sql:read", "jobs:read"],
    status: "beta",
    color: "#FF3621",
  },
  {
    name: "PostHog",
    category: "Data",
    description: "Product analytics, funnels and session context.",
    scopes: ["events:read", "persons:read"],
    status: "ga",
    color: "#F9BD2B",
  },

  // Communication
  {
    name: "Slack",
    category: "Communication",
    description: "Channels, threads, approvals and escalation routing.",
    scopes: ["chat:write", "channels:read"],
    status: "ga",
    color: "#611F69",
  },
  {
    name: "Gmail",
    category: "Communication",
    description: "Threads, labels, drafts and send-on-approval.",
    scopes: ["gmail.readonly", "gmail.compose"],
    status: "ga",
    color: "#EA4335",
  },
  {
    name: "Microsoft 365",
    category: "Communication",
    description: "Outlook mail, calendar and Teams messages.",
    scopes: ["Mail.Read", "Calendars.ReadWrite"],
    status: "ga",
    color: "#0078D4",
  },
  {
    name: "Zoom",
    category: "Communication",
    description: "Meetings, recordings and transcript retrieval.",
    scopes: ["meeting:read", "recording:read"],
    status: "ga",
    color: "#2D8CFF",
  },
  {
    name: "Twilio",
    category: "Communication",
    description: "SMS, voice and delivery status callbacks.",
    scopes: ["messages:write"],
    status: "ga",
    color: "#F22F46",
  },

  // Productivity
  {
    name: "Notion",
    category: "Productivity",
    description: "Pages, databases and internal knowledge search.",
    scopes: ["read_content", "insert_content"],
    status: "ga",
    color: "#111111",
  },
  {
    name: "Google Calendar",
    category: "Productivity",
    description: "Availability, holds and conflict-aware scheduling.",
    scopes: ["calendar.events"],
    status: "ga",
    color: "#1A73E8",
  },
  {
    name: "Linear",
    category: "Productivity",
    description: "Issues, cycles, projects and triage rules.",
    scopes: ["issues:read", "issues:write"],
    status: "ga",
    color: "#5E6AD2",
  },
  {
    name: "Jira",
    category: "Productivity",
    description: "Epics, sprints, transitions and JQL search.",
    scopes: ["read:jira-work", "write:jira-work"],
    status: "ga",
    color: "#0052CC",
  },
  {
    name: "Asana",
    category: "Productivity",
    description: "Projects, tasks, dependencies and workload.",
    scopes: ["tasks:read", "tasks:write"],
    status: "ga",
    color: "#F06A6A",
  },
  {
    name: "Airtable",
    category: "Productivity",
    description: "Base records, views and two-way sync.",
    scopes: ["data.records:read", "data.records:write"],
    status: "ga",
    color: "#18BFFF",
  },
  {
    name: "Google Sheets",
    category: "Productivity",
    description: "Read/write ranges with formula-safe updates.",
    scopes: ["spreadsheets"],
    status: "ga",
    color: "#0F9D58",
  },
  {
    name: "Confluence",
    category: "Productivity",
    description: "Spaces, pages and decision logs.",
    scopes: ["read:content", "write:content"],
    status: "ga",
    color: "#172B4D",
  },
  {
    name: "Miro",
    category: "Productivity",
    description: "Boards, frames and workshop artefacts.",
    scopes: ["boards:read"],
    status: "beta",
    color: "#FFD02F",
  },
  {
    name: "Zapier",
    category: "Productivity",
    description: "Trigger any of 7,000+ apps with guardrailed actions.",
    scopes: ["zap:run"],
    status: "ga",
    color: "#FF4F00",
  },

  // Finance
  {
    name: "Stripe",
    category: "Finance",
    description: "Payments, subscriptions, refunds and disputes.",
    scopes: ["charges:read", "refunds:write"],
    status: "ga",
    color: "#635BFF",
  },
  {
    name: "NetSuite",
    category: "Finance",
    description: "GL, AR/AP, revenue schedules and close tasks.",
    scopes: ["financials:read"],
    status: "ga",
    color: "#0C479D",
  },
  {
    name: "Ramp",
    category: "Finance",
    description: "Card spend, receipts and policy exceptions.",
    scopes: ["transactions:read"],
    status: "ga",
    color: "#F5C518",
  },
  {
    name: "QuickBooks",
    category: "Finance",
    description: "Invoices, bills, reconciliation and reports.",
    scopes: ["accounting:read"],
    status: "ga",
    color: "#2CA01C",
  },
  {
    name: "DocuSign",
    category: "Finance",
    description: "Envelopes, signing status and clause metadata.",
    scopes: ["signature:read"],
    status: "ga",
    color: "#FFCC22",
  },

  // Recruiting
  {
    name: "LinkedIn",
    category: "Recruiting",
    description: "Talent search, InMail drafts and company signals.",
    scopes: ["r_liteprofile", "r_emailaddress"],
    status: "ga",
    color: "#0A66C2",
  },
  {
    name: "Greenhouse",
    category: "Recruiting",
    description: "Jobs, candidates, scorecards and stages.",
    scopes: ["candidates:read", "jobs:read"],
    status: "ga",
    color: "#24A47F",
  },
  {
    name: "Ashby",
    category: "Recruiting",
    description: "Pipeline analytics, interview plans and offers.",
    scopes: ["candidates:read"],
    status: "beta",
    color: "#5A4FCF",
  },
  {
    name: "Workday",
    category: "Recruiting",
    description: "Requisitions, worker records and org data.",
    scopes: ["worker:read"],
    status: "beta",
    color: "#F38B00",
  },

  // Engineering
  {
    name: "GitHub",
    category: "Engineering",
    description: "Pull requests, reviews, issues and code search.",
    scopes: ["repo:read", "pull_requests:write"],
    status: "ga",
    color: "#24292F",
  },
  {
    name: "Sentry",
    category: "Engineering",
    description: "Issues, stack traces and release health.",
    scopes: ["event:read", "project:read"],
    status: "ga",
    color: "#362D59",
  },
  {
    name: "Datadog",
    category: "Engineering",
    description: "Metrics, logs, monitors and incident timelines.",
    scopes: ["metrics_read", "logs_read"],
    status: "ga",
    color: "#632CA6",
  },
  {
    name: "Vercel",
    category: "Engineering",
    description: "Deployments, preview URLs and build logs.",
    scopes: ["deployments:read"],
    status: "ga",
    color: "#000000",
  },
  {
    name: "PagerDuty",
    category: "Engineering",
    description: "On-call schedules, incidents and escalations.",
    scopes: ["incidents:read", "incidents:write"],
    status: "ga",
    color: "#06AC38",
  },

  // Marketing
  {
    name: "Google Ads",
    category: "Marketing",
    description: "Campaign performance, search terms and budgets.",
    scopes: ["adwords.readonly"],
    status: "ga",
    color: "#4285F4",
  },
  {
    name: "Meta Ads",
    category: "Marketing",
    description: "Audiences, creatives and spend breakdowns.",
    scopes: ["ads_read"],
    status: "ga",
    color: "#0866FF",
  },
  {
    name: "Ahrefs",
    category: "Marketing",
    description: "Keywords, backlinks and SERP movement.",
    scopes: ["site-explorer:read"],
    status: "ga",
    color: "#0B7BFF",
  },
  {
    name: "Webflow",
    category: "Marketing",
    description: "CMS collections, pages and publish approvals.",
    scopes: ["cms:read", "cms:write"],
    status: "ga",
    color: "#4353FF",
  },
  {
    name: "Figma",
    category: "Marketing",
    description: "Files, frames and design-token inspection.",
    scopes: ["file_read"],
    status: "ga",
    color: "#F24E1E",
  },

  // Commerce
  {
    name: "Shopify",
    category: "Commerce",
    description: "Orders, fulfilment, returns and customer history.",
    scopes: ["read_orders", "read_customers"],
    status: "ga",
    color: "#95BF47",
  },
  {
    name: "Gainsight",
    category: "Commerce",
    description: "Health scores, playbooks and renewal risk.",
    scopes: ["customer:read"],
    status: "beta",
    color: "#00B487",
  },
];

export const toolCategories = Array.from(new Set(toolCatalog.map((tool) => tool.category)));

export function getToolMeta(name: string) {
  return toolCatalog.find((tool) => tool.name === name);
}
