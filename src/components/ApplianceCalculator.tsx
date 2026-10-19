"use client";

import { useState } from "react";
import { APPLIANCES, type ApplianceUsage, centsPerKwh, cheapestPeriod, estimateBill, formatBlocks, peakPeriod, usd } from "@/lib/calc";
import type { UtilityRatePlan } from "@/lib/types";

interface Props {
  plan: UtilityRatePlan;
  monthlyKwh: number;
  onMonthlyKwhChange: (kwh: number) => void;
}

export function ApplianceCalculator({ plan, monthlyKwh, onMonthlyKwhChange }: Props) {
  const [usage, setUsage] = useState(() =>
    Object.fromEntries(APPLIANCES.map((a) => [a.id, { enabled: true, kwhPerLoad: a.kwhPerLoad, loadsPerWeek: a.defaultLoadsPerWeek }])),
  );

  const usages: ApplianceUsage[] = APPLIANCES.filter((a) => usage[a.id].enabled).map((a) => ({
    appliance: a,
    kwhPerLoad: usage[a.id].kwhPerLoad,
    loadsPerWeek: usage[a.id].loadsPerWeek,
  }));
  const estimate = estimateBill(plan, monthlyKwh, usages);
  const peak = peakPeriod(plan);
  const cheap = cheapestPeriod(plan);

  const update = (id: string, patch: Partial<(typeof usage)[string]>) => setUsage((u) => ({ ...u, [id]: { ...u[id], ...patch } }));

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold text-slate-900">What does a load of laundry or dishes really cost?</h2>
      <p className="mt-1 text-sm text-slate-600">
        Peak ({formatBlocks(peak)}) at {centsPerKwh(peak.pricePerKwh)} vs. {cheap.label.toLowerCase()} ({formatBlocks(cheap)}) at{" "}
        {centsPerKwh(cheap.pricePerKwh)}.
      </p>

      <div className="mt-5 text-sm">
        <div className={`${ROW} hidden border-b border-slate-200 pb-2 text-slate-500 sm:grid`}>
          <span className="font-medium">Appliance</span>
          <span className="font-medium">kWh / load</span>
          <span className="font-medium">Loads / week</span>
          <span className="text-right font-medium text-rose-700">Per load at peak</span>
          <span className="text-right font-medium text-emerald-700">Per load off-peak</span>
          <span className="text-right font-medium">Monthly savings</span>
        </div>
        {APPLIANCES.map((a) => {
          const u = usage[a.id];
          const cost = estimate.appliances.find((c) => c.id === a.id);
          return (
            <div key={a.id} className={`${ROW} border-b border-slate-100 py-3 ${u.enabled ? "" : "opacity-50"}`}>
              <label className="col-span-2 flex items-start gap-2 sm:col-span-1">
                <input type="checkbox" className="mt-1" checked={u.enabled} onChange={(e) => update(a.id, { enabled: e.target.checked })} />
                <span>
                  <span className="font-medium text-slate-900">{a.name}</span>
                  <span className="block text-xs text-slate-500">{a.note}</span>
                </span>
              </label>
              <Cell label="kWh / load">
                <NumberInput value={u.kwhPerLoad} step={0.1} min={0} onChange={(v) => update(a.id, { kwhPerLoad: v })} label={`${a.name} kWh per load`} />
              </Cell>
              <Cell label="Loads / week">
                <NumberInput value={u.loadsPerWeek} step={1} min={0} onChange={(v) => update(a.id, { loadsPerWeek: v })} label={`${a.name} loads per week`} />
              </Cell>
              <Cell label="Per load at peak" right className="font-medium text-rose-700">
                {cost ? usd(cost.perLoadPeak) : "—"}
              </Cell>
              <Cell label="Per load off-peak" right className="font-medium text-emerald-700">
                {cost ? usd(cost.perLoadCheapest) : "—"}
              </Cell>
              <Cell label="Monthly savings" right className="col-span-2 font-semibold text-slate-900 sm:col-span-1">
                {cost ? usd(cost.monthlySavings) : "—"}
              </Cell>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="text-sm text-slate-700">
          Your total monthly usage (kWh)
          <NumberInput value={monthlyKwh} step={10} min={0} onChange={onMonthlyKwhChange} label="Total monthly kWh" wide />
        </label>
        <p className="pb-2 text-xs text-slate-500">Typical for your area: ~{plan.typicalMonthlyKwh} kWh. Upload a bill below to use your real number.</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Stat tone="rose" label="Estimated bill if you run these at peak" value={usd(estimate.totalIfPeak)} />
        <Stat tone="emerald" label="Estimated bill if you shift them off-peak" value={usd(estimate.totalIfShifted)} />
        <Stat tone="slate" label="You save" value={`${usd(estimate.monthlySavings)}/mo`} sub={`${usd(estimate.annualSavings, 0)} per year`} />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Estimate = {usd(estimate.fixed)} fixed charge + {Math.round(estimate.baseKwh)} kWh of other household usage at your average rate + the appliances above. Excludes taxes and fees.
      </p>
    </section>
  );
}

const ROW = "grid grid-cols-2 items-center gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,2.2fr)_5.5rem_5.5rem_1fr_1fr_1fr]";

/** Grid cell that shows its column label inline on small screens, where the header row is hidden. */
function Cell({ label, right, className = "", children }: { label: string; right?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={`${className} ${right ? "sm:text-right" : ""}`}>
      <span className="block text-xs font-normal text-slate-500 sm:hidden">{label}</span>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, step, min, label, wide }: { value: number; onChange: (v: number) => void; step: number; min: number; label: string; wide?: boolean }) {
  return (
    <input
      type="number"
      aria-label={label}
      inputMode="decimal"
      className={`mt-1 block rounded-md border border-slate-300 px-2 py-1 text-slate-900 ${wide ? "w-32" : "w-20"}`}
      value={Number.isFinite(value) ? value : ""}
      step={step}
      min={min}
      onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
    />
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: "rose" | "emerald" | "slate" }) {
  const tones = { rose: "bg-rose-50 text-rose-700", emerald: "bg-emerald-50 text-emerald-700", slate: "bg-slate-900 text-white" };
  return (
    <div className={`rounded-xl p-4 ${tones[tone]}`}>
      <p className="text-sm opacity-90">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {sub && <p className="text-sm opacity-80">{sub}</p>}
    </div>
  );
}
