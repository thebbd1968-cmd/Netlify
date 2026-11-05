// Pure deal math for the public calculators.
//
// Kept free of React and of any browser API so the numbers can be checked (and
// reused by the product's analysis engine) independently of the pages. Every
// function returns `null` for a metric it cannot compute from the given inputs —
// a calculator that shows "—" is honest; one that shows 0% or Infinity is not.
//
// All money values are monthly unless the name says otherwise.

/** Parse a form field into a finite number. Empty, blank or garbage → null. */
export function toNumber(raw: string): number | null {
  if (raw == null) return null;
  const trimmed = String(raw).replace(/[$,\s]/g, "");
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/** True when every value in the list is a usable number (not null/NaN). */
export function allNumbers(...values: Array<number | null>): boolean {
  return values.every((v) => v !== null && Number.isFinite(v));
}

export interface ArvInputs {
  purchase: number;
  rehab: number;
  arv: number;
  costs: number; // holding + closing, total for the deal
}

export interface ArvResult {
  /** The 70% rule ceiling: 70% of ARV. */
  seventyPercentOfArv: number;
  /** Classic 70% rule max purchase price: 70% of ARV minus the rehab budget. */
  maxOfferAfterRehab: number;
  /** Everything the deal ties up: purchase + rehab + holding/closing. */
  totalInvested: number;
  /** Profit if the property sells at ARV: ARV − total invested. */
  profit: number;
  /** Profit ÷ total invested. Null when nothing is invested. */
  roi: number | null;
  /** Purchase price minus the after-rehab ceiling. Positive = over the rule. */
  overCeiling: number;
  /** Below the after-rehab ceiling, between the two, or above 70% of ARV. */
  position: "below" | "between" | "above";
  /** True when the deal still makes money at the given purchase price. */
  profitable: boolean;
}

/**
 * Fix-and-flip analysis using the 70% rule.
 *
 *   70% ceiling        = ARV × 0.70
 *   max offer          = ARV × 0.70 − rehab
 *   total invested     = purchase + rehab + holding/closing
 *   profit             = ARV − total invested
 *   ROI                = profit ÷ total invested
 */
export function calcArv({ purchase, rehab, arv, costs }: ArvInputs): ArvResult {
  const seventyPercentOfArv = arv * 0.7;
  const maxOfferAfterRehab = seventyPercentOfArv - rehab;
  const totalInvested = purchase + rehab + costs;
  const profit = arv - totalInvested;
  const roi = totalInvested > 0 ? profit / totalInvested : null;
  const overCeiling = purchase - maxOfferAfterRehab;
  const position: ArvResult["position"] =
    purchase <= maxOfferAfterRehab ? "below" : purchase <= seventyPercentOfArv ? "between" : "above";

  return {
    seventyPercentOfArv,
    maxOfferAfterRehab,
    totalInvested,
    profit,
    roi,
    overCeiling,
    position,
    profitable: profit > 0,
  };
}

export interface CashFlowInputs {
  price: number;
  downPaymentPct: number; // 0–100
  interestRate: number; // annual, percent
  loanTermYears: number;
  monthlyRent: number;
  taxes: number; // monthly
  insurance: number; // monthly
  vacancyPct: number; // percent of gross rent
  maintenancePct: number; // percent of gross rent
}

export interface CashFlowResult {
  downPayment: number;
  loanAmount: number;
  monthlyMortgage: number;
  vacancyLoss: number;
  maintenance: number;
  effectiveGrossIncome: number;
  operatingExpenses: number; // taxes + insurance + maintenance, monthly
  monthlyNetOperatingIncome: number; // before debt service
  monthlyCashFlow: number;
  annualCashFlow: number;
  annualNOI: number;
  capRate: number | null;
  cashInvested: number;
  cashOnCash: number | null;
  grossRentMultiplier: number | null;
}

/** Round to whole cents — what a lender, a receipt or a spreadsheet shows. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Rental analysis: amortised mortgage, cash flow and the three standard returns.
 *
 *   loan              = price × (1 − down%)
 *   monthly payment   = L × r ÷ (1 − (1 + r)^−n),  r = rate ÷ 12, n = term × 12
 *   effective gross   = rent × (1 − vacancy%)
 *   NOI               = effective gross − (taxes + insurance + rent × maintenance%)
 *   cash flow         = NOI − monthly payment
 *   cap rate          = (NOI × 12) ÷ price
 *   cash-on-cash      = (cash flow × 12) ÷ down payment
 *   GRM               = price ÷ (rent × 12)
 *
 * Money is rounded to cents as it is computed, so the monthly figures on screen
 * add up to the annual ones (a reader multiplying $213.40 by 12 gets $2,560.80).
 */
export function calcCashFlow(input: CashFlowInputs): CashFlowResult {
  const {
    price,
    downPaymentPct,
    interestRate,
    loanTermYears,
    monthlyRent,
    taxes,
    insurance,
    vacancyPct,
    maintenancePct,
  } = input;

  const downPayment = round2(price * (downPaymentPct / 100));
  const loanAmount = round2(Math.max(price - downPayment, 0));
  const months = Math.round(loanTermYears * 12);
  const monthlyRate = interestRate / 100 / 12;

  let monthlyMortgage = 0;
  if (months > 0 && loanAmount > 0) {
    monthlyMortgage =
      monthlyRate === 0
        ? loanAmount / months
        : (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  }
  monthlyMortgage = round2(monthlyMortgage);

  const vacancyLoss = round2(monthlyRent * (vacancyPct / 100));
  const maintenance = round2(monthlyRent * (maintenancePct / 100));
  const effectiveGrossIncome = round2(monthlyRent - vacancyLoss);
  const operatingExpenses = round2(taxes + insurance + maintenance);
  const monthlyNetOperatingIncome = round2(effectiveGrossIncome - operatingExpenses);
  const monthlyCashFlow = round2(monthlyNetOperatingIncome - monthlyMortgage);
  const annualCashFlow = round2(monthlyCashFlow * 12);
  const annualNOI = round2(monthlyNetOperatingIncome * 12);
  const annualGrossRent = monthlyRent * 12;

  return {
    downPayment,
    loanAmount,
    monthlyMortgage,
    vacancyLoss,
    maintenance,
    effectiveGrossIncome,
    operatingExpenses,
    monthlyNetOperatingIncome,
    monthlyCashFlow,
    annualCashFlow,
    annualNOI,
    capRate: price > 0 ? annualNOI / price : null,
    cashInvested: downPayment,
    cashOnCash: downPayment > 0 ? annualCashFlow / downPayment : null,
    grossRentMultiplier: annualGrossRent > 0 ? price / annualGrossRent : null,
  };
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** $232,000 — for headline figures. */
export function money(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "—" : usd.format(value);
}

/** $1,330.60 — for per-month figures where cents carry meaning. */
export function moneyExact(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "—" : usdCents.format(value);
}

/**
 * 29.3% — one decimal by default, two for rates small enough to need it (a cap
 * rate of 7.4% hides the difference between 7.44% and 7.35%).
 */
export function percent(value: number | null, digits = 1): string {
  return value === null || !Number.isFinite(value) ? "—" : `${(value * 100).toFixed(digits)}%`;
}

/** 9.47 — plain ratio, two decimals. */
export function ratio(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "—" : value.toFixed(2);
}
