import type { HourBlock, PeriodKind, RatePeriod, UtilityRatePlan } from "./types";

/*
 * Fallback for ZIPs outside our curated territories: the OpenEI U.S. Utility
 * Rate Database (https://openei.org/services/doc/rest/util_rates/). Requires
 * OPENEI_API_KEY (a free api.data.gov key).
 */

interface OpenEiTier {
  rate?: number;
  adj?: number;
}

export interface OpenEiRateItem {
  label: string;
  utility: string;
  name: string;
  uri?: string;
  startdate?: number;
  enddate?: number;
  fixedchargefirstmeter?: number;
  fixedchargeunits?: string;
  energyratestructure?: OpenEiTier[][];
  energyweekdayschedule?: number[][];
  energyweekendschedule?: number[][];
}

function periodPrice(tiers: OpenEiTier[] | undefined): number | null {
  const first = tiers?.[0];
  if (!first || typeof first.rate !== "number") return null;
  return first.rate + (first.adj ?? 0);
}

function toBlocks(hours: number[]): HourBlock[] {
  const blocks: HourBlock[] = [];
  for (const h of [...hours].sort((a, b) => a - b)) {
    const last = blocks[blocks.length - 1];
    if (last && last.end === h) last.end = h + 1;
    else blocks.push({ start: h, end: h + 1 });
  }
  return blocks;
}

function isTouName(name: string): boolean {
  return /time[- ]of[- ]|\bTOU\b|time of day|peak/i.test(name);
}

/** Convert one OpenEI rate into our plan shape for a given month (0–11). */
export function openEiItemToPlan(item: OpenEiRateItem, month: number): UtilityRatePlan | null {
  const structure = item.energyratestructure;
  const weekday = item.energyweekdayschedule?.[month];
  if (!structure?.length || !weekday || weekday.length !== 24) return null;

  const hoursByPeriod = new Map<number, number[]>();
  weekday.forEach((p, hour) => {
    hoursByPeriod.set(p, [...(hoursByPeriod.get(p) ?? []), hour]);
  });

  const priced = [...hoursByPeriod.entries()]
    .map(([p, hours]) => ({ p, hours, price: periodPrice(structure[p]) }))
    .filter((x): x is { p: number; hours: number[]; price: number } => x.price !== null);
  if (priced.length === 0) return null;

  // Merge periods that share a price (tiers often repeat per season).
  const byPrice = new Map<number, number[]>();
  for (const x of priced) {
    const key = Math.round(x.price * 10000) / 10000;
    byPrice.set(key, [...(byPrice.get(key) ?? []), ...x.hours]);
  }
  const sorted = [...byPrice.entries()].sort((a, b) => b[0] - a[0]);

  const periods: RatePeriod[] = sorted.map(([price, hours], i) => {
    let kind: PeriodKind;
    let label: string;
    if (sorted.length === 1) {
      kind = "offPeak";
      label = "Flat rate";
    } else if (i === 0) {
      kind = "peak";
      label = "Peak";
    } else if (i === sorted.length - 1 && sorted.length >= 3) {
      kind = "superOffPeak";
      label = "Super off-peak";
    } else {
      kind = "offPeak";
      label = sorted.length > 3 ? `Off-peak (${i})` : "Off-peak";
    }
    return { kind, label, pricePerKwh: price, hours: toBlocks(hours) };
  });

  const weekend = item.energyweekendschedule?.[month];
  const peakPeriodIdx = priced.find((x) => x.price === sorted[0][0])?.p;
  const weekdaysOnly = sorted.length > 1 && !!weekend && !weekend.includes(peakPeriodIdx ?? -1);

  const fixed =
    item.fixedchargeunits === "$/month" && typeof item.fixedchargefirstmeter === "number"
      ? item.fixedchargefirstmeter
      : item.fixedchargeunits === "$/day" && typeof item.fixedchargefirstmeter === "number"
        ? item.fixedchargefirstmeter * 30.4
        : 0;

  return {
    utilityId: `openei:${item.label}`,
    utilityName: item.utility,
    state: "",
    planName: item.name,
    weekdaysOnly,
    seasonNote: `Rates for ${new Date(2000, month, 1).toLocaleString("en-US", { month: "long" })} from the OpenEI Utility Rate Database. Energy charges only; taxes and some riders may be excluded.`,
    periods,
    fixedMonthlyCharge: Math.round(fixed * 100) / 100,
    typicalMonthlyKwh: 850,
    connect: { type: "pdf-only" },
    tariffUrl: item.uri ?? "https://apps.openei.org/USURDB/",
    source: "openei",
    ratesAsOf: item.startdate ? new Date(item.startdate * 1000).toISOString().slice(0, 10) : "unknown",
  };
}

/** Prefer a time-of-use plan; otherwise the default/most recent residential plan. */
export function pickBestPlan(items: OpenEiRateItem[], month: number): UtilityRatePlan | null {
  const plans = items
    .map((item) => ({ item, plan: openEiItemToPlan(item, month) }))
    .filter((x): x is { item: OpenEiRateItem; plan: UtilityRatePlan } => x.plan !== null)
    .sort((a, b) => (b.item.startdate ?? 0) - (a.item.startdate ?? 0));
  const tou = plans.find((x) => isTouName(x.item.name) && x.plan.periods.length > 1);
  return (tou ?? plans[0])?.plan ?? null;
}

export async function lookupOpenEi(zip: string, apiKey: string, now = new Date()): Promise<UtilityRatePlan | null> {
  const params = new URLSearchParams({
    version: "8",
    format: "json",
    api_key: apiKey,
    address: zip,
    sector: "Residential",
    approved: "true",
    detail: "full",
    limit: "25",
    orderby: "startdate",
    direction: "desc",
  });
  const res = await fetch(`https://api.openei.org/utility_rates?${params}`, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) throw new Error(`OpenEI request failed: ${res.status}`);
  const data = (await res.json()) as { items?: OpenEiRateItem[] };
  const current = (data.items ?? []).filter((i) => !i.enddate);
  return pickBestPlan(current.length ? current : data.items ?? [], now.getMonth());
}
