import { Link, createFileRoute } from "@tanstack/react-router";

import { MarketingShell } from "~/components/MarketingShell";
import {
  CopyLinkButton,
  NumberField,
  ResultTile,
  WorkedRow,
  useQueryInputs,
} from "~/components/calc-ui";
import { allNumbers, calcCashFlow, money, moneyExact, percent, ratio, toNumber } from "~/lib/calc";
import { SITE_URL, pageHead } from "~/lib/seo";

const TITLE = "Rental Cash Flow Calculator — Cap Rate & Cash-on-Cash";
const DESCRIPTION =
  "Free rental property calculator: amortised mortgage payment, monthly cash flow, cap rate, cash-on-cash return and gross rent multiplier, with every formula shown.";

export const Route = createFileRoute("/tools/cash-flow-calculator")({
  head: () =>
    pageHead({
      title: TITLE,
      description: DESCRIPTION,
      path: "/tools/cash-flow-calculator",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Rental Cash Flow Calculator",
        description: DESCRIPTION,
        url: `${SITE_URL}/tools/cash-flow-calculator`,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    }),
  component: CashFlowCalculator,
});

const DEFAULTS = {
  price: "250000",
  downPct: "20",
  rate: "7",
  term: "30",
  rent: "2200",
  taxes: "250",
  insurance: "120",
  vacancy: "5",
  maintenance: "8",
};

function CashFlowCalculator() {
  const { values, setField, reset } = useQueryInputs(DEFAULTS);

  const price = toNumber(values.price);
  const downPct = toNumber(values.downPct);
  const rate = toNumber(values.rate);
  const term = toNumber(values.term);
  const rent = toNumber(values.rent);
  const taxes = toNumber(values.taxes);
  const insurance = toNumber(values.insurance);
  const vacancy = toNumber(values.vacancy);
  const maintenance = toNumber(values.maintenance);

  const complete = allNumbers(
    price,
    downPct,
    rate,
    term,
    rent,
    taxes,
    insurance,
    vacancy,
    maintenance,
  );

  const result =
    complete &&
    price !== null &&
    downPct !== null &&
    rate !== null &&
    term !== null &&
    rent !== null &&
    taxes !== null &&
    insurance !== null &&
    vacancy !== null &&
    maintenance !== null
      ? calcCashFlow({
          price,
          downPaymentPct: downPct,
          interestRate: rate,
          loanTermYears: term,
          monthlyRent: rent,
          taxes,
          insurance,
          vacancyPct: vacancy,
          maintenancePct: maintenance,
        })
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
              Rental cash flow calculator
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              The real amortised mortgage payment, the cash left over each month, and the three
              numbers investors ask about first: cap rate, cash-on-cash return and gross rent
              multiplier. Vacancy and maintenance are costed in, not ignored.
            </p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Inputs */}
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <h2 className="text-base font-semibold">The property</h2>
            <p className="mt-1 text-xs text-slate-500">
              Results update as you type. Percentages are entered as numbers, so 20 means 20%.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <NumberField
                id="price"
                label="Purchase price"
                value={values.price}
                onChange={(v) => setField("price", v)}
                prefix="$"
                placeholder="250000"
              />
              <NumberField
                id="downPct"
                label="Down payment"
                value={values.downPct}
                onChange={(v) => setField("downPct", v)}
                suffix="%"
                placeholder="20"
              />
              <NumberField
                id="rate"
                label="Interest rate"
                hint="Annual, fixed"
                value={values.rate}
                onChange={(v) => setField("rate", v)}
                suffix="%"
                placeholder="7"
              />
              <NumberField
                id="term"
                label="Loan term"
                value={values.term}
                onChange={(v) => setField("term", v)}
                suffix="yrs"
                placeholder="30"
              />
              <NumberField
                id="rent"
                label="Monthly rent"
                value={values.rent}
                onChange={(v) => setField("rent", v)}
                prefix="$"
                placeholder="2200"
              />
              <NumberField
                id="taxes"
                label="Property taxes"
                hint="Monthly"
                value={values.taxes}
                onChange={(v) => setField("taxes", v)}
                prefix="$"
                placeholder="250"
              />
              <NumberField
                id="insurance"
                label="Insurance"
                hint="Monthly"
                value={values.insurance}
                onChange={(v) => setField("insurance", v)}
                prefix="$"
                placeholder="120"
              />
              <NumberField
                id="vacancy"
                label="Vacancy allowance"
                hint="Share of gross rent lost to turnover"
                value={values.vacancy}
                onChange={(v) => setField("vacancy", v)}
                suffix="%"
                placeholder="5"
              />
              <NumberField
                id="maintenance"
                label="Maintenance reserve"
                hint="Share of gross rent set aside for repairs"
                value={values.maintenance}
                onChange={(v) => setField("maintenance", v)}
                suffix="%"
                placeholder="8"
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
                    label="Monthly mortgage"
                    value={moneyExact(result.monthlyMortgage)}
                    detail="Principal & interest, amortised"
                    emphasis
                  />
                  <ResultTile
                    label="Monthly cash flow"
                    value={moneyExact(result.monthlyCashFlow)}
                    detail="After vacancy, costs and the mortgage"
                  />
                  <ResultTile
                    label="Cap rate"
                    value={percent(result.capRate, 2)}
                    detail="Annual NOI ÷ purchase price"
                  />
                  <ResultTile
                    label="Cash-on-cash return"
                    value={percent(result.cashOnCash, 2)}
                    detail="Annual cash flow ÷ cash invested"
                  />
                  <ResultTile
                    label="Gross rent multiplier"
                    value={ratio(result.grossRentMultiplier)}
                    detail="Price ÷ annual gross rent"
                  />
                  <ResultTile
                    label="Cash invested"
                    value={money(result.cashInvested)}
                    detail="Down payment out of pocket"
                  />
                </div>

                <div
                  className={
                    result.monthlyCashFlow > 0
                      ? "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
                      : "mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5"
                  }
                >
                  <h2 className="text-sm font-semibold text-slate-900">What this says</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    {verdict(result)}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="text-sm font-semibold">Worked numbers</h2>
                  <div className="mt-2">
                    <WorkedRow
                      label="Down payment"
                      formula={`${money(price)} × ${values.downPct || "0"}%`}
                      value={money(result.downPayment)}
                    />
                    <WorkedRow
                      label="Loan amount"
                      formula={`${money(price)} − ${money(result.downPayment)}`}
                      value={money(result.loanAmount)}
                    />
                    <WorkedRow
                      label="Monthly mortgage"
                      formula="L × r ÷ (1 − (1 + r)^−n), r = rate ÷ 12, n = term × 12"
                      value={moneyExact(result.monthlyMortgage)}
                    />
                    <WorkedRow
                      label="Vacancy loss"
                      formula={`${money(rent)} × ${values.vacancy || "0"}%`}
                      value={moneyExact(result.vacancyLoss)}
                    />
                    <WorkedRow
                      label="Maintenance reserve"
                      formula={`${money(rent)} × ${values.maintenance || "0"}%`}
                      value={moneyExact(result.maintenance)}
                    />
                    <WorkedRow
                      label="Monthly operating expenses"
                      formula={`${money(taxes)} taxes + ${money(insurance)} insurance + ${moneyExact(result.maintenance)} maintenance`}
                      value={moneyExact(result.operatingExpenses)}
                    />
                    <WorkedRow
                      label="Net operating income (monthly)"
                      formula={`(${money(rent)} − ${moneyExact(result.vacancyLoss)}) − ${moneyExact(result.operatingExpenses)}`}
                      value={moneyExact(result.monthlyNetOperatingIncome)}
                    />
                    <WorkedRow
                      label="Monthly cash flow"
                      formula={`${moneyExact(result.monthlyNetOperatingIncome)} − ${moneyExact(result.monthlyMortgage)}`}
                      value={moneyExact(result.monthlyCashFlow)}
                    />
                    <WorkedRow
                      label="Annual cash flow"
                      formula={`${moneyExact(result.monthlyCashFlow)} × 12`}
                      value={moneyExact(result.annualCashFlow)}
                    />
                    <WorkedRow
                      label="Cap rate"
                      formula={`(${moneyExact(result.monthlyNetOperatingIncome)} × 12) ÷ ${money(price)}`}
                      value={percent(result.capRate, 2)}
                    />
                    <WorkedRow
                      label="Cash-on-cash"
                      formula={`${moneyExact(result.annualCashFlow)} ÷ ${money(result.cashInvested)}`}
                      value={percent(result.cashOnCash, 2)}
                    />
                    <WorkedRow
                      label="Gross rent multiplier"
                      formula={`${money(price)} ÷ (${money(rent)} × 12)`}
                      value={ratio(result.grossRentMultiplier)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8">
                <h2 className="text-base font-semibold">Fill in every field</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  This calculator needs all nine figures — price, down payment, rate, term, rent,
                  taxes, insurance, vacancy and maintenance. Anything left empty or not a number is
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
            Standard amortisation and the usual rental metrics, written out so you can reproduce
            every figure in a spreadsheet.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              {
                name: "Monthly mortgage",
                formula: "L × r ÷ (1 − (1 + r)^−n)",
                body: "A fully amortising loan: L is the loan amount, r the monthly rate (annual rate ÷ 12) and n the number of payments (years × 12). At 7% over 30 years the payment is $6.65 per $1,000 borrowed. A 0% rate falls back to loan ÷ months.",
              },
              {
                name: "Effective gross income",
                formula: "rent × (1 − vacancy %)",
                body: "Rent you can count on after allowing for turnover. A 5% vacancy allowance on $2,200 is $110 a month, or $1,320 a year — roughly a fortnight empty plus a lost month between tenants.",
              },
              {
                name: "Net operating income",
                formula: "effective gross income − (taxes + insurance + rent × maintenance %)",
                body: "Income after operating costs, before the mortgage. The mortgage is deliberately excluded: NOI describes the property, not how you financed it.",
              },
              {
                name: "Monthly cash flow",
                formula: "NOI − monthly mortgage",
                body: "What actually lands in your account. Negative cash flow is a real monthly cost — it is the number that decides whether the deal is affordable, not the cap rate.",
              },
              {
                name: "Cap rate",
                formula: "(NOI × 12) ÷ purchase price",
                body: "The unlevered yield: what the property earns on its full price if bought with cash. It is the one metric you can compare across markets and property sizes.",
              },
              {
                name: "Cash-on-cash return",
                formula: "(monthly cash flow × 12) ÷ cash invested",
                body: "Return on the money you actually put in — the down payment. It rises with leverage when the cap rate beats the interest rate, and falls when it does not.",
              },
              {
                name: "Gross rent multiplier",
                formula: "purchase price ÷ (monthly rent × 12)",
                body: "How many years of gross rent the price represents. It ignores costs and financing entirely, which is why it is a first-pass screen, not a decision.",
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
            <h3 className="text-sm font-semibold text-slate-900">What this model leaves out</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Management fees (typically 8–10% of rent), leasing fees, HOA dues, utilities the
              owner pays, capital expenditure on roofs and HVAC, and any rent growth or
              appreciation. It also assumes the full loan term runs at a fixed rate. Add those
              before you commit: a management fee alone can turn a thin positive cash flow negative.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold sm:text-xl">
            Track the whole portfolio, not one deal
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Douglas Real Estate Systems keeps this analysis on the property record, then shows
            equity, cash flow and occupancy across every property you own. Plans start at
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
              to="/tools/arv-calculator"
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:border-slate-400"
            >
              Try the ARV &amp; 70% rule calculator
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

/** Plain-language read of the numbers. No urgency, no advice — just what the maths says. */
function verdict(result: ReturnType<typeof calcCashFlow>): string {
  const flow =
    result.monthlyCashFlow > 0
      ? `After the ${moneyExact(result.monthlyMortgage)} mortgage, vacancy and running costs, the property leaves ${moneyExact(result.monthlyCashFlow)} a month — ${moneyExact(result.annualCashFlow)} a year.`
      : result.monthlyCashFlow === 0
        ? `The property breaks exactly even each month after the ${moneyExact(result.monthlyMortgage)} mortgage and running costs.`
        : `After the ${moneyExact(result.monthlyMortgage)} mortgage, vacancy and running costs, the property costs ${moneyExact(Math.abs(result.monthlyCashFlow))} a month out of pocket — ${moneyExact(Math.abs(result.annualCashFlow))} a year.`;

  return `${flow} The cap rate of ${percent(result.capRate, 2)} is what the property earns on its full price before financing; the cash-on-cash return of ${percent(result.cashOnCash, 2)} is what it earns on the ${money(result.cashInvested)} you actually put in.`;
}
