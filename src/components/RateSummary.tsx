import { centsPerKwh, cheapestPeriod, formatBlocks, peakPeriod, periodAtHour } from "@/lib/calc";
import type { UtilityRatePlan } from "@/lib/types";
import { KIND_STYLES, PeakTimeline } from "./PeakTimeline";

export function RateSummary({ plan, now }: { plan: UtilityRatePlan; now: Date }) {
  const peak = peakPeriod(plan);
  const cheap = cheapestPeriod(plan);
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const current = plan.weekdaysOnly && isWeekend ? cheap : periodAtHour(plan, now.getHours());

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Your electric utility</p>
          <h2 className="text-2xl font-semibold text-slate-900">{plan.utilityName}</h2>
          <p className="text-sm text-slate-600">{plan.planName}</p>
        </div>
        <div className={`rounded-full px-3 py-1 text-sm font-medium ${current.kind === "peak" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
          Right now: {current.label} · {centsPerKwh(current.pricePerKwh)}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-700">Peak hours (most expensive)</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatBlocks(peak)}</p>
          <p className="text-sm text-slate-600">
            {plan.weekdaysOnly ? "Weekdays only" : "Every day"} · <span className="font-semibold">{centsPerKwh(peak.pricePerKwh)}</span>
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-700">Cheapest time to run appliances</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatBlocks(cheap)}</p>
          <p className="text-sm text-slate-600">
            {plan.weekdaysOnly ? "Plus all day on weekends" : cheap.label} · <span className="font-semibold">{centsPerKwh(cheap.pricePerKwh)}</span>
          </p>
        </div>
      </div>

      <div className="mt-6">
        <PeakTimeline plan={plan} nowHour={plan.weekdaysOnly && isWeekend ? undefined : now.getHours()} />
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-700">
          {[...plan.periods]
            .sort((a, b) => b.pricePerKwh - a.pricePerKwh)
            .map((p) => (
              <li key={p.label} className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-sm ${KIND_STYLES[p.kind].dot}`} />
                {p.label}: {centsPerKwh(p.pricePerKwh)}
              </li>
            ))}
        </ul>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {plan.seasonNote} Estimated all-in residential prices ({plan.ratesAsOf}); your exact rate depends on your plan.{" "}
        <a className="underline" href={plan.tariffUrl} target="_blank" rel="noreferrer">
          View official rates
        </a>
      </p>
    </section>
  );
}
