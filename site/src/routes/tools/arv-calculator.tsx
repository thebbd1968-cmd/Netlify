import { Link, createFileRoute } from "@tanstack/react-router";

import { MarketingShell } from "~/components/MarketingShell";
import {
  CopyLinkButton,
  NumberField,
  ResultTile,
  WorkedRow,
  useQueryInputs,
} from "~/components/calc-ui";
import { allNumbers, calcArv, money, percent, toNumber } from "~/lib/calc";
import { SITE_URL, pageHead } from "~/lib/seo";

const TITLE = "ARV Calculator — 70% Rule Max Offer & Flip Profit";
const DESCRIPTION =
  "Free ARV calculator for fix-and-flip deals: the 70% rule max offer, total cash invested, projected profit and ROI, with the formulas shown. No sign-up.";

export const Route = createFileRoute("/tools/arv-calculator")({
  head: () =>
    pageHead({
      title: TITLE,
      description: DESCRIPTION,
      path: "/tools/arv-calculator",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "ARV & 70% Rule Calculator",
        description: DESCRIPTION,
        url: `${SITE_URL}/tools/arv-calculator`,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    }),
  component: ArvCalculator,
});

const DEFAULTS = {
  purchase: "180000",
  rehab: "40000",
  arv: "300000",
  costs: "12000",
};

function ArvCalculator() {
  const { values, setField, reset } = useQueryInputs(DEFAULTS);

  const purchase = toNumber(values.purchase);
  const rehab = toNumber(values.rehab);
  const arv = toNumber(values.arv);
  const costs = toNumber(values.costs);

  const complete = allNumbers(purchase, rehab, arv, costs);
  const result =
    complete && purchase !== null && rehab !== null && arv !== null && costs !== null
      ? calcArv({ purchase, rehab, arv, costs })
      : null;

  return (
    <MarketingShell>
      {/* Intro */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Free tool · no account needed
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
              ARV &amp; 70% rule calculator
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Enter the purchase price, rehab budget, after-repair value and holding costs to see
              the 70% rule max offer, what the deal ties up in cash, the profit if it sells at ARV
              and the return on what you put in. Every number is worked out below the results, so
              you can check the maths yourself.
            </p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Inputs */}
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <h2 className="text-base font-semibold">The deal</h2>
            <p className="mt-1 text-xs text-slate-500">
              All figures in US dollars. Results update as you type.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <NumberField
                id="purchase"
                label="Purchase price"
                value={values.purchase}
                onChange={(v) => setField("purchase", v)}
                prefix="$"
                placeholder="180000"
              />
              <NumberField
                id="rehab"
                label="Rehab cost"
                hint="Total renovation budget"
                value={values.rehab}
                onChange={(v) => setField("rehab", v)}
                prefix="$"
                placeholder="40000"
              />
              <NumberField
                id="arv"
                label="After-repair value (ARV)"
                hint="What it is worth renovated"
                value={values.arv}
                onChange={(v) => setField("arv", v)}
                prefix="$"
                placeholder="300000"
              />
              <NumberField
                id="costs"
                label="Holding + closing costs"
                hint="Loan interest, taxes, insurance, buy and sell closing"
                value={values.costs}
                onChange={(v) => setField("costs", v)}
                prefix="$"
                placeholder="12000"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900"
              >
                Reset to example
              </button>
              <CopyLinkButton />
            </div>
          </div>

          {/* Results */}
          <div className="min-w-0 lg:col-span-3" aria-live="polite">
            {result ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ResultTile
                    label="70% rule max offer"
                    value={money(result.seventyPercentOfArv)}
                    detail="70% × ARV, before the rehab budget"
                    emphasis
                  />
                  <ResultTile
                    label="Max offer after rehab"
                    value={money(result.maxOfferAfterRehab)}
                    detail="70% × ARV − rehab"
                  />
                  <ResultTile
                    label="Total invested"
                    value={money(result.totalInvested)}
                    detail="Purchase + rehab + holding & closing"
                  />
                  <ResultTile
                    label="Projected profit at ARV"
                    value={money(result.profit)}
                    detail="ARV − total invested"
                  />
                  <ResultTile
                    label="ROI on total invested"
                    value={percent(result.roi)}
                    detail="Profit ÷ total invested"
                  />
                  <ResultTile
                    label={result.overCeiling > 0 ? "Over the ceiling by" : "Under the ceiling by"}
                    value={money(Math.abs(result.overCeiling))}
                    detail="Purchase price vs the after-rehab max offer"
                  />
                </div>

                <div
                  className={
                    result.position === "below" && result.profitable
                      ? "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
                      : result.position === "between" && result.profitable
                        ? "mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5"
                        : "mt-4 rounded-2xl border border-slate-300 bg-slate-50 p-5"
                  }
                >
                  <h2 className="text-sm font-semibold text-slate-900">What this says</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    {verdict(result, purchase ?? 0)}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="text-sm font-semibold">Worked numbers</h2>
                  <div className="mt-2">
                    <WorkedRow
                      label="70% of ARV"
                      formula={`${money(arv)} × 0.70`}
                      value={money(result.seventyPercentOfArv)}
                    />
                    <WorkedRow
                      label="Max offer after rehab"
                      formula={`${money(result.seventyPercentOfArv)} − ${money(rehab)} rehab`}
                      value={money(result.maxOfferAfterRehab)}
                    />
                    <WorkedRow
                      label="Total invested"
                      formula={`${money(purchase)} + ${money(rehab)} + ${money(costs)}`}
                      value={money(result.totalInvested)}
                    />
                    <WorkedRow
                      label="Profit at ARV"
                      formula={`${money(arv)} − ${money(result.totalInvested)}`}
                      value={money(result.profit)}
                    />
                    <WorkedRow
                      label="ROI"
                      formula={`${money(result.profit)} ÷ ${money(result.totalInvested)}`}
                      value={percent(result.roi)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8">
                <h2 className="text-base font-semibold">Fill in the four figures</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  The calculator needs a purchase price, rehab cost, ARV and holding + closing
                  costs. Any box left empty or filled with something that is not a number is
                  skipped rather than treated as zero, so you never get a made-up result.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it is calculated */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">How this is calculated</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
            Nothing here is proprietary — these are the formulas investors have used for decades,
            written out so you can reproduce every figure by hand.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              {
                name: "70% rule ceiling",
                formula: "ARV × 0.70",
                body: "The most you would pay for a property before spending anything on it. The 30% left over is meant to cover rehab, holding costs, selling costs and the profit you are taking the risk for.",
              },
              {
                name: "Max offer after rehab",
                formula: "ARV × 0.70 − rehab cost",
                body: "The classic 70% rule number: subtract the renovation budget from the ceiling, because every dollar of rehab is a dollar you cannot spend on the purchase.",
              },
              {
                name: "Total invested",
                formula: "purchase + rehab + holding & closing",
                body: "Everything the deal ties up before it sells. Holding costs are loan interest, taxes, insurance and utilities; closing costs are what you pay to buy and to sell.",
              },
              {
                name: "Projected profit",
                formula: "ARV − total invested",
                body: "The gain if the property sells at full after-repair value. Real exits usually land under ARV, so treat this as the best case.",
              },
              {
                name: "ROI",
                formula: "profit ÷ total invested",
                body: "Return on every dollar the deal consumed, not just the down payment. A 29.3% ROI means $29,300 of profit per $100,000 invested over the life of the flip.",
              },
              {
                name: "Position vs the ceiling",
                formula: "purchase price − max offer after rehab",
                body: "Positive means you are paying above the rule; negative means the deal leaves margin for the surprises every renovation produces.",
              },
            ].map((item) => (
              <div key={item.name} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                <p className="mt-2 overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">
                  {item.formula}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 max-w-3xl">
            <h3 className="text-sm font-semibold text-slate-900">What the 70% rule is really for</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              It is a screening tool, not a valuation. It answers one question quickly: at this
              price, is there enough spread between what I pay and what the house is worth to absorb
              a renovation that runs over and a sale that takes longer than planned? A deal that
              fails the rule is not automatically bad — a light cosmetic rehab in a fast market can
              work on thinner margins — but it does mean the margin has to be justified some other
              way, not assumed.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              The biggest input is also the least certain: ARV. It comes from sold comparables of
              similar size, condition and location within the last few months — not from asking
              prices, and not from the estimate a portal shows you. If the ARV moves 10%, every
              number on this page moves with it.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold sm:text-xl">
            Keep the analysis attached to the deal
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Douglas Real Estate Systems saves this underwriting to the deal record, tracks it
            through the pipeline and keeps the comps and follow-ups next to it. Plans start at
            $29/month; the calculators stay free either way.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/pricing"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              See plans and pricing
            </Link>
            <Link
              to="/tools/cash-flow-calculator"
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:border-slate-400"
            >
              Try the rental cash flow calculator
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

/** Plain-language read of the numbers. No urgency, no advice — just what the maths says. */
function verdict(result: ReturnType<typeof calcArv>, purchase: number): string {
  const ceiling = money(result.maxOfferAfterRehab);
  const spread = money(Math.abs(result.overCeiling));

  const position =
    result.position === "below"
      ? `At ${money(purchase)} the purchase price sits ${spread} under the ${ceiling} ceiling the 70% rule allows once rehab is counted.`
      : result.position === "between"
        ? `At ${money(purchase)} the purchase price is ${spread} above the ${ceiling} ceiling once rehab is counted, though still under 70% of ARV. The margin is thinner than the rule wants.`
        : `At ${money(purchase)} the purchase price is ${spread} above the ${ceiling} ceiling, and above 70% of ARV. There is very little room left for a rehab that runs over or a sale that takes longer.`;

  const outcome = result.profitable
    ? `If it sells at full ARV, profit is ${money(result.profit)} on ${money(result.totalInvested)} invested — a ${percent(result.roi)} return.`
    : `At full ARV the deal does not cover what it consumes: it loses ${money(Math.abs(result.profit))} on ${money(result.totalInvested)} invested.`;

  return `${position} ${outcome}`;
}
