/** A contiguous block of hours [start, end) on a 24h clock. end may be 24. */
export interface HourBlock {
  start: number;
  end: number;
}

export type PeriodKind = "peak" | "offPeak" | "superOffPeak";

export interface RatePeriod {
  kind: PeriodKind;
  label: string;
  /** All-in price in USD per kWh (energy + delivery), before taxes. */
  pricePerKwh: number;
  hours: HourBlock[];
}

/** How a customer can share their real usage with us. */
export type ConnectMethod =
  | { type: "green-button"; portalUrl: string }
  | { type: "pdf-only" };

export interface UtilityRatePlan {
  utilityId: string;
  utilityName: string;
  state: string;
  planName: string;
  /** Peak pricing applies on weekdays only (weekends are off-peak all day). */
  weekdaysOnly: boolean;
  /** Free-text note about seasonality, e.g. "Summer rates (Jun–Sep)". */
  seasonNote: string;
  periods: RatePeriod[];
  /** Fixed monthly customer / basic service charge in USD. */
  fixedMonthlyCharge: number;
  /** Typical residential usage in kWh/month for this territory. */
  typicalMonthlyKwh: number;
  connect: ConnectMethod;
  tariffUrl: string;
  /** Where the numbers came from: our curated table or a live OpenEI lookup. */
  source: "curated" | "openei";
  ratesAsOf: string;
}

export interface UtilityLookupResult {
  zip: string;
  plan: UtilityRatePlan;
}
