import { describe, expect, it } from "vitest";
import { applyBillToPlan, effectiveRate, monthlyKwhFromBill, type ParsedBill } from "../bill";
import { APPLIANCES, applianceCost, blendedRate, cheapestPeriod, estimateBill, formatBlocks, peakPeriod, periodAtHour } from "../calc";
import { openEiItemToPlan, pickBestPlan, type OpenEiRateItem } from "../openei";
import { findUtilityIdForZip, getCuratedPlan, UTILITIES } from "../utilities";

describe("ZIP lookup", () => {
  it.each([
    ["94103", "pge"],
    ["92101", "sdge"],
    ["92660", "sce"],
    ["90012", "ladwp"],
    ["10001", "coned"],
    ["60614", "comed"],
    ["33101", "fpl"],
    ["30303", "georgia_power"],
    ["85004", "aps"],
    ["80202", "xcel_co"],
    ["75201", "oncor_tx"],
  ])("%s -> %s", (zip, id) => {
    expect(findUtilityIdForZip(zip)).toBe(id);
  });

  it("returns null for uncovered or invalid ZIPs", () => {
    expect(findUtilityIdForZip("02108")).toBeNull();
    expect(findUtilityIdForZip("9410")).toBeNull();
    expect(findUtilityIdForZip("abcde")).toBeNull();
  });

  it("every curated plan covers all 24 hours exactly once", () => {
    for (const id of Object.keys(UTILITIES)) {
      const counts = new Array(24).fill(0);
      for (const p of UTILITIES[id].periods) for (const b of p.hours) for (let h = b.start; h < b.end; h++) counts[h]++;
      expect(counts, id).toEqual(new Array(24).fill(1));
    }
  });
});

describe("cost math", () => {
  const pge = getCuratedPlan("pge")!;
  const dryer = APPLIANCES.find((a) => a.id === "dryer")!;

  it("finds peak and cheapest periods", () => {
    expect(peakPeriod(pge).pricePerKwh).toBe(0.62);
    expect(cheapestPeriod(pge).pricePerKwh).toBe(0.5);
    expect(formatBlocks(peakPeriod(pge))).toBe("4 PM–9 PM");
    expect(periodAtHour(pge, 17).kind).toBe("peak");
    expect(periodAtHour(pge, 21).kind).toBe("offPeak");
  });

  it("prices a dryer load at peak vs off-peak", () => {
    const c = applianceCost(pge, { appliance: dryer, kwhPerLoad: 3, loadsPerWeek: 4 });
    expect(c.perLoadPeak).toBeCloseTo(1.86);
    expect(c.perLoadCheapest).toBeCloseTo(1.5);
    expect(c.monthlySavings).toBeCloseTo(3 * 4 * (52 / 12) * 0.12);
  });

  it("blended rate weights hours, with weekends at the cheapest rate for weekday-only plans", () => {
    expect(blendedRate(pge)).toBeCloseTo((0.62 * 5 + 0.5 * 19) / 24);
    const coned = getCuratedPlan("coned")!;
    const weekday = (0.42 * 16 + 0.16 * 8) / 24;
    expect(blendedRate(coned)).toBeCloseTo((weekday * 5 + 0.16 * 2) / 7);
  });

  it("estimates a bill both ways and the difference is the appliance savings", () => {
    const e = estimateBill(pge, 450, [{ appliance: dryer, kwhPerLoad: 3, loadsPerWeek: 4 }]);
    expect(e.totalIfPeak - e.totalIfShifted).toBeCloseTo(e.appliances[0].monthlySavings);
    expect(e.annualSavings).toBeCloseTo(e.monthlySavings * 12);
    expect(e.baseKwh).toBeCloseTo(450 - e.appliances[0].monthlyKwh);
  });
});

describe("OpenEI conversion", () => {
  const peakHours = (h: number) => (h >= 16 && h < 21 ? 1 : 0);
  const item: OpenEiRateItem = {
    label: "abc",
    utility: "Example Electric",
    name: "Residential Time-of-Use",
    startdate: 1735689600,
    fixedchargefirstmeter: 12,
    fixedchargeunits: "$/month",
    energyratestructure: [[{ rate: 0.1, adj: 0.02 }], [{ rate: 0.3 }]],
    energyweekdayschedule: Array.from({ length: 12 }, () => Array.from({ length: 24 }, (_, h) => peakHours(h))),
    energyweekendschedule: Array.from({ length: 12 }, () => new Array(24).fill(0)),
  };

  it("maps schedule matrices to peak/off-peak blocks", () => {
    const plan = openEiItemToPlan(item, 6)!;
    expect(plan.periods).toHaveLength(2);
    expect(peakPeriod(plan)).toMatchObject({ kind: "peak", pricePerKwh: 0.3, hours: [{ start: 16, end: 21 }] });
    expect(cheapestPeriod(plan).pricePerKwh).toBeCloseTo(0.12);
    expect(plan.weekdaysOnly).toBe(true);
    expect(plan.fixedMonthlyCharge).toBe(12);
  });

  it("prefers a TOU plan over a flat plan", () => {
    const flat: OpenEiRateItem = { ...item, label: "flat", name: "Residential Service", startdate: 1767225600, energyratestructure: [[{ rate: 0.15 }]], energyweekdayschedule: Array.from({ length: 12 }, () => new Array(24).fill(0)) };
    expect(pickBestPlan([flat, item], 0)?.planName).toBe("Residential Time-of-Use");
  });
});

describe("bill helpers", () => {
  const bill: ParsedBill = {
    utilityName: "PG&E",
    ratePlan: "E-TOU-C",
    billingPeriodStart: "2026-08-01",
    billingPeriodEnd: "2026-08-31",
    billingDays: 31,
    totalKwh: 620,
    totalElectricCharges: 340,
    fixedCharges: 24,
    touBreakdown: [
      { period: "Peak", kwh: 120, pricePerKwh: 0.64, hours: "4pm-9pm" },
      { period: "Off-Peak", kwh: 500, pricePerKwh: 0.52, hours: null },
    ],
    notes: "",
  };

  it("computes effective rate and normalized monthly kWh", () => {
    expect(effectiveRate(bill)).toBeCloseTo(316 / 620);
    expect(monthlyKwhFromBill(bill)).toBe(600);
  });

  it("overlays bill prices onto the plan by period kind", () => {
    const plan = applyBillToPlan(getCuratedPlan("pge")!, bill);
    expect(peakPeriod(plan).pricePerKwh).toBe(0.64);
    expect(cheapestPeriod(plan).pricePerKwh).toBe(0.52);
  });
});
