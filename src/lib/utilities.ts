import type { UtilityRatePlan } from "./types";

/*
 * Curated residential time-of-use plans for the MVP launch territories.
 *
 * Prices are approximate all-in (energy + delivery) residential rates and are
 * meant for estimates only. Always link users to the tariff page. Update
 * `ratesAsOf` whenever these numbers are refreshed.
 */
const RATES_AS_OF = "2026-Q3 (estimate)";

export const UTILITIES: Record<string, Omit<UtilityRatePlan, "source" | "ratesAsOf">> = {
  pge: {
    utilityId: "pge",
    utilityName: "Pacific Gas and Electric (PG&E)",
    state: "CA",
    planName: "E-TOU-C (Peak 4–9 PM daily)",
    weekdaysOnly: false,
    seasonNote: "Summer rates (Jun–Sep); winter peak prices are ~10% lower.",
    periods: [
      { kind: "peak", label: "Peak", pricePerKwh: 0.62, hours: [{ start: 16, end: 21 }] },
      { kind: "offPeak", label: "Off-peak", pricePerKwh: 0.5, hours: [{ start: 0, end: 16 }, { start: 21, end: 24 }] },
    ],
    fixedMonthlyCharge: 24.15,
    typicalMonthlyKwh: 450,
    connect: { type: "green-button", portalUrl: "https://www.pge.com/en/save-energy-and-money/energy-usage-and-tips/understand-my-usage/share-energy-usage-data.html" },
    tariffUrl: "https://www.pge.com/tariffs/en/rate-information/electric-rates.html",
  },
  sce: {
    utilityId: "sce",
    utilityName: "Southern California Edison (SCE)",
    state: "CA",
    planName: "TOU-D-4-9PM",
    weekdaysOnly: false,
    seasonNote: "Summer rates (Jun–Sep).",
    periods: [
      { kind: "peak", label: "On-peak", pricePerKwh: 0.55, hours: [{ start: 16, end: 21 }] },
      { kind: "offPeak", label: "Off-peak", pricePerKwh: 0.33, hours: [{ start: 0, end: 16 }, { start: 21, end: 24 }] },
    ],
    fixedMonthlyCharge: 24.15,
    typicalMonthlyKwh: 550,
    connect: { type: "green-button", portalUrl: "https://www.sce.com/partners/partnerships/Green-Button" },
    tariffUrl: "https://www.sce.com/residential/rates/Time-Of-Use-Residential-Rate-Plans",
  },
  sdge: {
    utilityId: "sdge",
    utilityName: "San Diego Gas & Electric (SDG&E)",
    state: "CA",
    planName: "TOU-DR1",
    weekdaysOnly: false,
    seasonNote: "Summer rates (Jun–Oct). Super off-peak runs midnight–6 AM.",
    periods: [
      { kind: "peak", label: "On-peak", pricePerKwh: 0.7, hours: [{ start: 16, end: 21 }] },
      { kind: "offPeak", label: "Off-peak", pricePerKwh: 0.45, hours: [{ start: 6, end: 16 }, { start: 21, end: 24 }] },
      { kind: "superOffPeak", label: "Super off-peak", pricePerKwh: 0.36, hours: [{ start: 0, end: 6 }] },
    ],
    fixedMonthlyCharge: 24.15,
    typicalMonthlyKwh: 400,
    connect: { type: "green-button", portalUrl: "https://www.sdge.com/residential/savings-center/energy-management-tools/green-button-connect" },
    tariffUrl: "https://www.sdge.com/whenmatters",
  },
  ladwp: {
    utilityId: "ladwp",
    utilityName: "Los Angeles Dept. of Water and Power (LADWP)",
    state: "CA",
    planName: "R-1(B) Time-of-Use",
    weekdaysOnly: true,
    seasonNote: "High season (Jun–Sep) rates.",
    periods: [
      { kind: "peak", label: "High peak", pricePerKwh: 0.36, hours: [{ start: 13, end: 17 }] },
      { kind: "offPeak", label: "Low peak", pricePerKwh: 0.22, hours: [{ start: 10, end: 13 }, { start: 17, end: 20 }] },
      { kind: "superOffPeak", label: "Base", pricePerKwh: 0.17, hours: [{ start: 0, end: 10 }, { start: 20, end: 24 }] },
    ],
    fixedMonthlyCharge: 10,
    typicalMonthlyKwh: 500,
    connect: { type: "pdf-only" },
    tariffUrl: "https://www.ladwp.com/account/customer-service/electric-rates/residential-rates",
  },
  coned: {
    utilityId: "coned",
    utilityName: "Con Edison",
    state: "NY",
    planName: "Residential Time-of-Use",
    weekdaysOnly: true,
    seasonNote: "Summer rates (Jun–Sep).",
    periods: [
      { kind: "peak", label: "Peak", pricePerKwh: 0.42, hours: [{ start: 8, end: 24 }] },
      { kind: "offPeak", label: "Off-peak", pricePerKwh: 0.16, hours: [{ start: 0, end: 8 }] },
    ],
    fixedMonthlyCharge: 20,
    typicalMonthlyKwh: 350,
    connect: { type: "green-button", portalUrl: "https://www.coned.com/en/accounts-billing/my-account/green-button" },
    tariffUrl: "https://www.coned.com/en/save-money/energy-saving-programs/time-of-use",
  },
  comed: {
    utilityId: "comed",
    utilityName: "ComEd",
    state: "IL",
    planName: "Time of Day Pricing",
    weekdaysOnly: false,
    seasonNote: "Summer rates (Jun–Sep).",
    periods: [
      { kind: "peak", label: "Peak", pricePerKwh: 0.24, hours: [{ start: 13, end: 19 }] },
      { kind: "offPeak", label: "Off-peak", pricePerKwh: 0.13, hours: [{ start: 6, end: 13 }, { start: 19, end: 22 }] },
      { kind: "superOffPeak", label: "Super off-peak", pricePerKwh: 0.09, hours: [{ start: 0, end: 6 }, { start: 22, end: 24 }] },
    ],
    fixedMonthlyCharge: 16,
    typicalMonthlyKwh: 650,
    connect: { type: "green-button", portalUrl: "https://www.comed.com/MyAccount/MyBillUsage/Pages/GreenButtonConnect.aspx" },
    tariffUrl: "https://www.comed.com/MyAccount/MyBillUsage/Pages/TimeOfDay.aspx",
  },
  fpl: {
    utilityId: "fpl",
    utilityName: "Florida Power & Light (FPL)",
    state: "FL",
    planName: "Residential Time-of-Use (RTR-1)",
    weekdaysOnly: true,
    seasonNote: "Apr–Oct peak hours shown (12–9 PM); Nov–Mar peak is 6–10 AM & 6–10 PM.",
    periods: [
      { kind: "peak", label: "On-peak", pricePerKwh: 0.21, hours: [{ start: 12, end: 21 }] },
      { kind: "offPeak", label: "Off-peak", pricePerKwh: 0.11, hours: [{ start: 0, end: 12 }, { start: 21, end: 24 }] },
    ],
    fixedMonthlyCharge: 9.61,
    typicalMonthlyKwh: 1100,
    connect: { type: "pdf-only" },
    tariffUrl: "https://www.fpl.com/rates/time-of-use.html",
  },
  georgia_power: {
    utilityId: "georgia_power",
    utilityName: "Georgia Power",
    state: "GA",
    planName: "Time of Use – Overnight Advantage (TOU-REO)",
    weekdaysOnly: true,
    seasonNote: "Summer on-peak (Jun–Sep). Super off-peak 11 PM–7 AM year-round.",
    periods: [
      { kind: "peak", label: "On-peak", pricePerKwh: 0.29, hours: [{ start: 14, end: 19 }] },
      { kind: "offPeak", label: "Off-peak", pricePerKwh: 0.1, hours: [{ start: 7, end: 14 }, { start: 19, end: 23 }] },
      { kind: "superOffPeak", label: "Super off-peak", pricePerKwh: 0.025, hours: [{ start: 0, end: 7 }, { start: 23, end: 24 }] },
    ],
    fixedMonthlyCharge: 14,
    typicalMonthlyKwh: 1050,
    connect: { type: "pdf-only" },
    tariffUrl: "https://www.georgiapower.com/residential/billing-and-rate-plans/pricing-and-rate-plans.html",
  },
  aps: {
    utilityId: "aps",
    utilityName: "Arizona Public Service (APS)",
    state: "AZ",
    planName: "Saver Choice (TOU-E)",
    weekdaysOnly: true,
    seasonNote: "Summer rates (Jun–Sep).",
    periods: [
      { kind: "peak", label: "On-peak", pricePerKwh: 0.3, hours: [{ start: 16, end: 19 }] },
      { kind: "offPeak", label: "Off-peak", pricePerKwh: 0.12, hours: [{ start: 0, end: 16 }, { start: 19, end: 24 }] },
    ],
    fixedMonthlyCharge: 16.5,
    typicalMonthlyKwh: 1000,
    connect: { type: "pdf-only" },
    tariffUrl: "https://www.aps.com/en/Residential/Service-Plans/Compare-Service-Plans",
  },
  xcel_co: {
    utilityId: "xcel_co",
    utilityName: "Xcel Energy (Colorado)",
    state: "CO",
    planName: "Residential Time-of-Use (RE-TOU)",
    weekdaysOnly: true,
    seasonNote: "Summer rates (Jun–Sep). Shoulder 1–3 PM is shown as off-peak.",
    periods: [
      { kind: "peak", label: "On-peak", pricePerKwh: 0.26, hours: [{ start: 15, end: 19 }] },
      { kind: "offPeak", label: "Off-peak", pricePerKwh: 0.12, hours: [{ start: 0, end: 15 }, { start: 19, end: 24 }] },
    ],
    fixedMonthlyCharge: 7.1,
    typicalMonthlyKwh: 650,
    connect: { type: "green-button", portalUrl: "https://co.my.xcelenergy.com/s/billing-payment/green-button" },
    tariffUrl: "https://co.my.xcelenergy.com/s/residential/time-of-use-pricing",
  },
  oncor_tx: {
    utilityId: "oncor_tx",
    utilityName: "Oncor (TX — choose a retail provider)",
    state: "TX",
    planName: "Typical retail free-nights plan",
    weekdaysOnly: false,
    seasonNote: "Deregulated market: prices depend on your retail electricity provider. Shown: a typical free-nights plan incl. Oncor delivery.",
    periods: [
      { kind: "peak", label: "Day", pricePerKwh: 0.22, hours: [{ start: 6, end: 21 }] },
      { kind: "superOffPeak", label: "Free nights (delivery only)", pricePerKwh: 0.06, hours: [{ start: 0, end: 6 }, { start: 21, end: 24 }] },
    ],
    fixedMonthlyCharge: 9.95,
    typicalMonthlyKwh: 1150,
    connect: { type: "green-button", portalUrl: "https://www.smartmetertexas.com/" },
    tariffUrl: "https://www.powertochoose.org/",
  },
};

/*
 * ZIP -> utility. 5-digit entries win over 3-digit prefixes, which lets us
 * carve out municipal utilities (e.g. LADWP inside SCE's prefixes).
 * Coarse by design: prefixes can straddle territories, so the UI lets
 * users correct the utility.
 */
const ZIP5: Record<string, string> = {};
for (let z = 90001; z <= 90089; z++) ZIP5[String(z)] = "ladwp";
for (const z of ["91303", "91304", "91306", "91307", "91311", "91316", "91324", "91325", "91326", "91330", "91335", "91340", "91342", "91343", "91344", "91345", "91352", "91356", "91364", "91367", "91401", "91402", "91403", "91405", "91406", "91411", "91423", "91436", "91601", "91602", "91604", "91605", "91606", "91607"]) {
  ZIP5[z] = "ladwp";
}

const ZIP3_RANGES: Array<[number, number, string]> = [
  // California
  [900, 908, "sce"], [910, 918, "sce"], [922, 925, "sce"], [926, 928, "sce"], [930, 931, "sce"], [935, 935, "sce"],
  [919, 921, "sdge"],
  [932, 934, "pge"], [936, 961, "pge"],
  // New York City
  [100, 104, "coned"], [112, 112, "coned"], [113, 114, "coned"],
  // Chicago / northern Illinois
  [600, 609, "comed"],
  // Florida (FPL-heavy prefixes)
  [330, 334, "fpl"], [339, 339, "fpl"], [341, 341, "fpl"], [349, 349, "fpl"],
  // Georgia
  [300, 319, "georgia_power"], [398, 399, "georgia_power"],
  // Arizona (Phoenix metro & outlying)
  [850, 853, "aps"], [855, 857, "aps"], [859, 860, "aps"], [863, 865, "aps"],
  // Colorado
  [800, 816, "xcel_co"],
  // Dallas–Fort Worth
  [750, 754, "oncor_tx"], [760, 763, "oncor_tx"],
];

export function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

export function findUtilityIdForZip(zip: string): string | null {
  if (!isValidZip(zip)) return null;
  if (ZIP5[zip]) return ZIP5[zip];
  const prefix = Number(zip.slice(0, 3));
  for (const [lo, hi, id] of ZIP3_RANGES) {
    if (prefix >= lo && prefix <= hi) return id;
  }
  return null;
}

export function getCuratedPlan(utilityId: string): UtilityRatePlan | null {
  const u = UTILITIES[utilityId];
  return u ? { ...u, source: "curated", ratesAsOf: RATES_AS_OF } : null;
}

export function listCuratedUtilities(): Array<{ id: string; name: string; state: string }> {
  return Object.values(UTILITIES)
    .map((u) => ({ id: u.utilityId, name: u.utilityName, state: u.state }))
    .sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name));
}
