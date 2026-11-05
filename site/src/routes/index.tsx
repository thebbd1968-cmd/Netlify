import { Link, createFileRoute } from "@tanstack/react-router";

import { PLANS } from "~/lib/plans";
import { SITE_NAME, SITE_URL, pageHead } from "~/lib/seo";

const TITLE = "Douglas Real Estate Systems — real estate operations platform";
const DESCRIPTION =
  "Deal analysis, portfolio tracking, CRM automation and transaction workflows for real estate agents, investors and brokerages — executed, not just explained. From $29/mo.";

/** SoftwareApplication + its three priced offers, read straight from the plans. */
const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  description:
    "Real estate operations platform: deal analysis with ARV, rehab and ROI, deal pipeline, CRM with automated follow-ups, portfolio tracking and reporting for agents, investors and small firms.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: `${SITE_URL}/`,
  offers: PLANS.map((plan) => ({
    "@type": "Offer",
    name: plan.name,
    description: `${plan.name} plan — ${plan.seats} included.`,
    price: plan.price.toFixed(2),
    priceCurrency: "USD",
    url: plan.gumroadUrl,
    availability: "https://schema.org/InStock",
  })),
};

export const Route = createFileRoute("/")({
  head: () =>
    pageHead({
      title: TITLE,
      description: DESCRIPTION,
      path: "/",
      jsonLd: softwareApplicationJsonLd,
    }),
  component: Home,
});

const segments = [
  {
    title: "Agents & brokerages",
    body: "Run deal flow, client follow-ups and listings from one pipeline instead of five spreadsheets.",
    icon: "🏡",
  },
  {
    title: "Investors",
    body: "Analyse a property in seconds — ARV, rehab, cap rate, cash-on-cash — and track the whole portfolio.",
    icon: "📈",
  },
  {
    title: "Small & mid-size firms",
    body: "One system for operations, deals and reporting, with seats for the whole team and white-label options.",
    icon: "🏢",
  },
];

const features = [
  {
    title: "Deal analysis engine",
    body: "Underwrite fix-and-flip, rental and wholesale deals with ARV, rehab budgets, ROI and cash-on-cash — saved to the deal record automatically.",
  },
  {
    title: "Deal pipeline",
    body: "A kanban board from lead to close, with stage history so nothing silently dies in your inbox.",
  },
  {
    title: "CRM & automated follow-ups",
    body: "Contacts, activity history and AI-written nurture sequences that keep past clients and warm leads moving.",
  },
  {
    title: "Portfolio tracking",
    body: "Every property you own in one view: equity, cash flow, occupancy and performance against your plan.",
  },
  {
    title: "Property research",
    body: "Comparable sales, rent estimates and market context attached to the property before you make an offer.",
  },
  {
    title: "Reporting",
    body: "Pipeline value, conversion by stage and portfolio returns — the numbers you would otherwise rebuild by hand every month.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Import your book",
    body: "Add contacts, properties and active deals in minutes. No migration project, no consultant.",
  },
  {
    step: "02",
    title: "Work the pipeline",
    body: "Move deals through stages, log activity and let follow-ups fire on their own schedule.",
  },
  {
    step: "03",
    title: "Decide with numbers",
    body: "Underwrite with the analysis engine and watch portfolio performance on the dashboard.",
  },
];

function Home() {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
              DR
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              Douglas Real Estate Systems
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 sm:flex">
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <a href="#who" className="hover:text-slate-900">
              Who it&apos;s for
            </a>
            <Link to="/pricing" className="hover:text-slate-900">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Log in
            </Link>
            <a
              href="/signup"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Get started
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Now onboarding agents, investors and firms
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
                The operations system for real estate that actually does the work.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
                Douglas Real Estate Systems runs your deal analysis, pipeline, portfolio and client
                follow-ups in one place. It doesn&apos;t just tell you what to do — it produces the
                underwriting, the dashboard and the next follow-up for you.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a
                  href="/signup"
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  Create your account
                </a>
                <Link
                  to="/pricing"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 hover:border-slate-400"
                >
                  See plans — from $29/mo
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Log in
                </Link>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Monthly subscription, cancel any time. Billing handled securely through Gumroad.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Already purchased?{' '}
                <a href="/signup" className="font-medium text-slate-900 underline">
                  Create your account
                </a>{' '}
                with your Gumroad email, then paste your license key to activate it.
              </p>
            </div>

            <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-6 border-t border-slate-200 pt-8 sm:grid-cols-4">
              {[
                ["Deal analysis", "ARV · rehab · ROI"],
                ["Pipeline", "Lead → close"],
                ["Portfolio", "Equity & cash flow"],
                ["Follow-ups", "Automated nurture"],
              ].map(([term, detail]) => (
                <div key={term}>
                  <dt className="text-sm font-semibold text-slate-900">{term}</dt>
                  <dd className="mt-1 text-sm text-slate-500">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="who" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Built for how you work</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Generic AI tools hand you text. Douglas hands you a finished analysis, an updated
            pipeline and a client who has already heard from you.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {segments.map((segment) => (
              <div
                key={segment.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="text-2xl">{segment.icon}</div>
                <h3 className="mt-4 text-lg font-semibold">{segment.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{segment.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Everything a deal touches
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              One workspace, one login, one source of truth — from first lead to closed
              transaction and the follow-up six months later.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Live in an afternoon</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {workflow.map((item) => (
              <div key={item.step} className="rounded-2xl border border-slate-200 p-6">
                <span className="text-xs font-semibold tracking-widest text-slate-400">
                  {item.step}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Free tools, no sign-up</h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              The same maths the analysis engine runs, available to anyone. Every result is
              shareable as a link and the formulas are printed on the page.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <Link
                to="/tools/arv-calculator"
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400"
              >
                <h3 className="text-lg font-semibold">ARV &amp; 70% rule calculator</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Purchase price, rehab, ARV and holding costs in — the 70% rule max offer, total
                  invested, projected profit and ROI out.
                </p>
                <span className="mt-4 inline-block text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 group-hover:decoration-slate-900">
                  Open the ARV calculator
                </span>
              </Link>
              <Link
                to="/tools/cash-flow-calculator"
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400"
              >
                <h3 className="text-lg font-semibold">Rental cash flow calculator</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Amortised mortgage, monthly cash flow, cap rate, cash-on-cash return and gross
                  rent multiplier — with vacancy and maintenance costed in.
                </p>
                <span className="mt-4 inline-block text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 group-hover:decoration-slate-900">
                  Open the cash flow calculator
                </span>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-900 text-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Pick the plan that fits your book
                </h2>
                <p className="mt-3 text-slate-300">
                  Starter at ${PLANS[0].price}/mo, Professional at ${PLANS[1].price}/mo and
                  Enterprise at ${PLANS[2].price}/mo. Every plan includes the CRM, deal pipeline and
                  analysis engine.
                </p>
              </div>
              <Link
                to="/pricing"
                className="inline-flex shrink-0 items-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                See pricing &amp; plans
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Douglas Real Estate Systems</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/tools/arv-calculator" className="hover:text-slate-900">
              ARV calculator
            </Link>
            <Link to="/tools/cash-flow-calculator" className="hover:text-slate-900">
              Cash flow calculator
            </Link>
            <Link to="/pricing" className="hover:text-slate-900">
              Pricing
            </Link>
            <Link to="/login" className="hover:text-slate-900">
              Log in
            </Link>
            <a href="/signup" className="hover:text-slate-900">
              Create account
            </a>
            <a href="/api/health" className="hover:text-slate-900">
              Status
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
