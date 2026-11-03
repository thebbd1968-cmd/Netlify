// Single source of truth for the three published subscription tiers.
// Prices and permalinks must match the live Gumroad products:
// douglas-re-starter $29/mo, douglas-re-pro $79/mo, douglas-re-enterprise $199/mo.
export interface Plan {
  tier: string;
  name: string;
  price: number;
  interval: string;
  tagline: string;
  seats: string;
  features: string[];
  gumroadUrl: string;
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    tier: "starter",
    name: "Starter",
    price: 29,
    interval: "month",
    tagline: "For solo agents getting organized.",
    seats: "1 seat",
    features: [
      "1 seat",
      "CRM with unlimited contacts",
      "Deal kanban board",
      "Property analysis engine",
      "Basic reporting dashboard",
    ],
    gumroadUrl: "https://douglasconsulting.gumroad.com/l/douglas-re-starter",
  },
  {
    tier: "professional",
    name: "Professional",
    price: 79,
    interval: "month",
    tagline: "For growing teams that live in their pipeline.",
    seats: "5 seats",
    features: [
      "5 seats",
      "Everything in Starter",
      "Advanced analytics & reports",
      "Portfolio tracking",
      "AI-powered nurture sequences",
      "Priority email support",
    ],
    gumroadUrl: "https://douglasconsulting.gumroad.com/l/douglas-re-pro",
    highlight: true,
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    price: 199,
    interval: "month",
    tagline: "For brokerages and institutional investors.",
    seats: "Unlimited seats",
    features: [
      "Unlimited seats",
      "Everything in Professional",
      "White-label / custom branding",
      "Priority phone & chat support",
      "Custom integrations (MLS, Zapier)",
      "Dedicated account manager",
    ],
    gumroadUrl: "https://douglasconsulting.gumroad.com/l/douglas-re-enterprise",
  },
];
