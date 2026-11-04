import { Link, createFileRoute } from "@tanstack/react-router";

import { PLANS } from "~/lib/plans";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Douglas Real Estate Systems" },
      {
        name: "description",
        content:
          "Three monthly plans: Starter $29, Professional $79, Enterprise $199. CRM, deal pipeline, portfolio tracking and automated nurture included.",
      },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
              DR
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              Douglas Real Estate Systems
            </span>
          </Link>
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
              Create account
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Pricing that scales with your book
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Monthly subscriptions, cancel any time. Every plan includes the CRM, deal pipeline and
            property analysis engine.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.tier}
              className={
                plan.highlight
                  ? "relative rounded-2xl border-2 border-slate-900 bg-white p-7 shadow-lg"
                  : "relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
              }
            >
              {plan.highlight ? (
                <span className="absolute -top-3 left-7 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              ) : null}
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">${plan.price}</span>
                <span className="text-sm text-slate-500">/{plan.interval}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{plan.seats} included</p>

              <a
                href={plan.gumroadUrl}
                className={
                  plan.highlight
                    ? "mt-6 block rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
                    : "mt-6 block rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-900 hover:border-slate-400"
                }
              >
                Subscribe to {plan.name} — ${plan.price}/mo
              </a>

              <ul className="mt-7 space-y-3 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5">
                    <span aria-hidden className="mt-0.5 text-emerald-600">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <h2 className="text-lg font-semibold">Already purchased?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            Create your account with the email you used on Gumroad, then paste the license key from
            your receipt on the activation page. Your plan is active as soon as the key checks out.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a
              href="/signup"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create your account
            </a>
            <a
              href="/activate"
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:border-slate-400"
            >
              Activate your license
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Not subscribed yet? The buttons above go to Gumroad checkout, then come back here.
          </p>
        </div>
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Douglas Real Estate Systems</p>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-slate-900">
              Home
            </Link>
            <Link to="/login" className="hover:text-slate-900">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
