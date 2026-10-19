import type { RatePeriod, UtilityRatePlan } from "./types";

export const WEEKS_PER_MONTH = 52 / 12;

export interface Appliance {
  id: string;
  name: string;
  /** Typical energy per load/cycle in kWh. */
  kwhPerLoad: number;
  defaultLoadsPerWeek: number;
  note: string;
}

/* Typical per-cycle energy use (ENERGY STAR / DOE averages, rounded). */
export const APPLIANCES: Appliance[] = [
  { id: "washer", name: "Washing machine", kwhPerLoad: 0.5, defaultLoadsPerWeek: 4, note: "Per load, warm wash. Cold wash uses ~0.3 kWh." },
  { id: "dryer", name: "Electric dryer", kwhPerLoad: 3.0, defaultLoadsPerWeek: 4, note: "Per load. Heat-pump dryers use ~1.5 kWh." },
  { id: "dishwasher", name: "Dishwasher", kwhPerLoad: 1.2, defaultLoadsPerWeek: 5, note: "Per cycle incl. water heating; skip heated dry to save ~15%." },
];

export function peakPeriod(plan: UtilityRatePlan): RatePeriod {
  return plan.periods.reduce((a, b) => (b.pricePerKwh > a.pricePerKwh ? b : a));
}

export function cheapestPeriod(plan: UtilityRatePlan): RatePeriod {
  return plan.periods.reduce((a, b) => (b.pricePerKwh < a.pricePerKwh ? b : a));
}

/** Rate in effect at a given hour (0–23) on a weekday. */
export function periodAtHour(plan: UtilityRatePlan, hour: number): RatePeriod {
  const p = plan.periods.find((p) => p.hours.some((b) => hour >= b.start && hour < b.end));
  return p ?? cheapestPeriod(plan);
}

function hoursIn(period: RatePeriod): number {
  return period.hours.reduce((n, b) => n + (b.end - b.start), 0);
}

/**
 * Average price for usage spread evenly over the week (no load shifting).
 * Weekends count as the cheapest period when peak is weekday-only.
 */
export function blendedRate(plan: UtilityRatePlan): number {
  const weekday = plan.periods.reduce((sum, p) => sum + p.pricePerKwh * hoursIn(p), 0) / 24;
  if (!plan.weekdaysOnly) return weekday;
  const weekend = cheapestPeriod(plan).pricePerKwh;
  return (weekday * 5 + weekend * 2) / 7;
}

export interface ApplianceUsage {
  appliance: Appliance;
  kwhPerLoad: number;
  loadsPerWeek: number;
}

export interface ApplianceCost {
  id: string;
  name: string;
  monthlyKwh: number;
  perLoadPeak: number;
  perLoadCheapest: number;
  monthlyPeak: number;
  monthlyCheapest: number;
  monthlySavings: number;
}

export function applianceCost(plan: UtilityRatePlan, usage: ApplianceUsage): ApplianceCost {
  const peak = peakPeriod(plan).pricePerKwh;
  const low = cheapestPeriod(plan).pricePerKwh;
  const monthlyKwh = usage.kwhPerLoad * usage.loadsPerWeek * WEEKS_PER_MONTH;
  return {
    id: usage.appliance.id,
    name: usage.appliance.name,
    monthlyKwh,
    perLoadPeak: usage.kwhPerLoad * peak,
    perLoadCheapest: usage.kwhPerLoad * low,
    monthlyPeak: monthlyKwh * peak,
    monthlyCheapest: monthlyKwh * low,
    monthlySavings: monthlyKwh * (peak - low),
  };
}

export interface BillEstimate {
  baseKwh: number;
  baseCost: number;
  fixed: number;
  appliances: ApplianceCost[];
  totalIfPeak: number;
  totalIfShifted: number;
  monthlySavings: number;
  annualSavings: number;
}

/**
 * Estimate a monthly bill two ways: running the listed appliances during peak
 * vs. during the cheapest window. Everything else in the home (`totalMonthlyKwh`
 * minus appliance kWh) is billed at the blended rate.
 */
export function estimateBill(plan: UtilityRatePlan, totalMonthlyKwh: number, usages: ApplianceUsage[]): BillEstimate {
  const appliances = usages.map((u) => applianceCost(plan, u));
  const applianceKwh = appliances.reduce((n, a) => n + a.monthlyKwh, 0);
  const baseKwh = Math.max(0, totalMonthlyKwh - applianceKwh);
  const baseCost = baseKwh * blendedRate(plan);
  const fixed = plan.fixedMonthlyCharge;
  const totalIfPeak = fixed + baseCost + appliances.reduce((n, a) => n + a.monthlyPeak, 0);
  const totalIfShifted = fixed + baseCost + appliances.reduce((n, a) => n + a.monthlyCheapest, 0);
  const monthlySavings = totalIfPeak - totalIfShifted;
  return { baseKwh, baseCost, fixed, appliances, totalIfPeak, totalIfShifted, monthlySavings, annualSavings: monthlySavings * 12 };
}

export function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

export function formatBlocks(period: RatePeriod): string {
  return period.hours.map((b) => `${formatHour(b.start)}–${formatHour(b.end)}`).join(", ");
}

export function usd(n: number, digits = 2): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function centsPerKwh(price: number): string {
  return `${(price * 100).toFixed(1)}¢/kWh`;
}
