import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Header/footer chrome for the public tool pages, matching the marketing pages
 * (same slate palette, same logo lockup, same link styles) so a visitor who lands
 * on a calculator from search does not feel dropped into a different site.
 */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
              DR
            </span>
            <span className="truncate text-[15px] font-semibold tracking-tight">
              Douglas Real Estate Systems
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
            <Link to="/tools/arv-calculator" className="hover:text-slate-900">
              ARV calculator
            </Link>
            <Link to="/tools/cash-flow-calculator" className="hover:text-slate-900">
              Cash flow calculator
            </Link>
            <Link to="/pricing" className="hover:text-slate-900">
              Pricing
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
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

      <main>{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                  DR
                </span>
                <span className="text-sm font-semibold">Douglas Real Estate Systems</span>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Deal analysis, portfolio tracking, CRM and automated follow-ups for agents,
                investors and firms.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-6 text-sm text-slate-500">
              <div>
                <p className="font-semibold text-slate-900">Free tools</p>
                <ul className="mt-3 space-y-2">
                  <li>
                    <Link to="/tools/arv-calculator" className="hover:text-slate-900">
                      ARV / 70% rule calculator
                    </Link>
                  </li>
                  <li>
                    <Link to="/tools/cash-flow-calculator" className="hover:text-slate-900">
                      Rental cash flow calculator
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Product</p>
                <ul className="mt-3 space-y-2">
                  <li>
                    <Link to="/pricing" className="hover:text-slate-900">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="hover:text-slate-900">
                      Log in
                    </Link>
                  </li>
                  <li>
                    <a href="/signup" className="hover:text-slate-900">
                      Create account
                    </a>
                  </li>
                  <li>
                    <a href="/api/health" className="hover:text-slate-900">
                      Status
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <p className="mt-8 border-t border-slate-200 pt-6 text-xs text-slate-500">
            © {new Date().getFullYear()} Douglas Real Estate Systems. Calculator results are
            estimates for planning only, not an appraisal, offer or investment advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
