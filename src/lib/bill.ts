import { z } from "zod";

export const BillSchema = z.object({
  utilityName: z.string().describe("Electric utility or retail provider name as printed on the bill"),
  ratePlan: z.string().nullable().describe("Rate plan / tariff code, e.g. E-TOU-C. Null if not shown."),
  billingPeriodStart: z.string().nullable().describe("YYYY-MM-DD"),
  billingPeriodEnd: z.string().nullable().describe("YYYY-MM-DD"),
  billingDays: z.number().nullable(),
  totalKwh: z.number().nullable().describe("Total electricity used in the billing period, kWh"),
  totalElectricCharges: z.number().nullable().describe("Total electric charges in USD (exclude gas/water)"),
  fixedCharges: z.number().nullable().describe("Fixed / basic service / customer charges in USD"),
  touBreakdown: z
    .array(
      z.object({
        period: z.string().describe("Period name as printed, e.g. Peak, Off-Peak, Super Off-Peak"),
        kwh: z.number().nullable(),
        pricePerKwh: z.number().nullable().describe("USD per kWh"),
        hours: z.string().nullable().describe("Hours this period applies if printed, e.g. 4pm-9pm"),
      }),
    )
    .describe("Per time-of-use period usage and price. Empty if the bill is not time-of-use."),
  notes: z.string().describe("One or two sentences on anything unusual (estimated read, credits, solar/NEM, tiered rates)."),
});

export type ParsedBill = z.infer<typeof BillSchema>;

export const ACCEPTED_BILL_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const;
export type AcceptedBillType = (typeof ACCEPTED_BILL_TYPES)[number];
export const MAX_BILL_BYTES = 10 * 1024 * 1024;

/** Effective all-in price per kWh after fixed charges are removed. */
export function effectiveRate(bill: ParsedBill): number | null {
  if (!bill.totalKwh || !bill.totalElectricCharges) return null;
  const variable = bill.totalElectricCharges - (bill.fixedCharges ?? 0);
  return variable > 0 ? variable / bill.totalKwh : null;
}

const KIND_PATTERNS: Array<[RegExp, "superOffPeak" | "offPeak" | "peak"]> = [
  [/super\s*off/i, "superOffPeak"],
  [/off|night|base|low/i, "offPeak"],
  [/peak|on|day|high/i, "peak"],
];

/** Overlay per-period prices printed on the bill onto a published plan. */
export function applyBillToPlan<T extends { periods: Array<{ kind: string; pricePerKwh: number }> }>(plan: T, bill: ParsedBill): T {
  const prices = new Map<string, number>();
  for (const row of bill.touBreakdown) {
    if (!row.pricePerKwh) continue;
    const kind = KIND_PATTERNS.find(([re]) => re.test(row.period))?.[1];
    if (kind && !prices.has(kind)) prices.set(kind, row.pricePerKwh);
  }
  if (prices.size === 0) return plan;
  return { ...plan, periods: plan.periods.map((p) => ({ ...p, pricePerKwh: prices.get(p.kind) ?? p.pricePerKwh })) };
}

/** Bill usage normalized to a 30-day month. */
export function monthlyKwhFromBill(bill: ParsedBill): number | null {
  if (!bill.totalKwh) return null;
  return bill.billingDays ? Math.round((bill.totalKwh / bill.billingDays) * 30) : Math.round(bill.totalKwh);
}
