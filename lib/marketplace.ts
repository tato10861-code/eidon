export interface MarketplaceTemplate {
  id: string;
  slug: string;
  name: string;
  role: string;
  department: string;
  title: string;
  tagline: string;
  description: string;
  accent: string;
  initials: string;
  rating: number;
  runs: string;
  author: string;
  installs: string;
  skills: string[];
  channels: string[];
}

export const marketplaceTemplates: MarketplaceTemplate[] = [
  {
    id: "tpl-revops-analyst",
    slug: "revops-analyst",
    name: "Riley",
    role: "analyst",
    department: "Revenue",
    title: "Revenue Operations Analyst",
    tagline: "Pipeline hygiene, forecast accuracy, and the numbers behind the number.",
    description:
      "Riley keeps the CRM honest, reconciles pipeline to finance, and flags forecast risk before the board pack.",
    accent: "#7C8CFF",
    initials: "RI",
    rating: 4.8,
    runs: "4.2k",
    author: "Eidon Labs",
    installs: "1.2k",
    skills: [
      "Pipeline hygiene",
      "Forecast modelling",
      "Revenue reconciliation",
      "Win/loss analysis",
    ],
    channels: ["Web", "Slack"],
  },
  {
    id: "tpl-it-helpdesk",
    slug: "it-helpdesk",
    name: "Ivy",
    role: "support",
    department: "IT",
    title: "IT Helpdesk Agent",
    tagline: "Resets, access, and the tickets that should never reach a human.",
    description:
      "Ivy handles password resets, access requests and common IT issues with policy-aware approvals.",
    accent: "#5FE9D0",
    initials: "IV",
    rating: 4.7,
    runs: "9.1k",
    author: "Eidon Labs",
    installs: "3.4k",
    skills: ["Access provisioning", "Password resets", "Ticket triage", "Knowledge base"],
    channels: ["Web", "Slack", "Email"],
  },
];
