"use client";

import { useEffect, useState } from "react";
import { applyBillToPlan, monthlyKwhFromBill, type ParsedBill } from "@/lib/bill";
import type { UtilityRatePlan } from "@/lib/types";
import { ApplianceCalculator } from "./ApplianceCalculator";
import { BillConnect } from "./BillConnect";
import { RateSummary } from "./RateSummary";

interface UtilityOption {
  id: string;
  name: string;
  state: string;
}

export function JouleApp({ utilities }: { utilities: UtilityOption[] }) {
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<UtilityRatePlan | null>(null);
  const [monthlyKwh, setMonthlyKwh] = useState(0);
  const [now, setNow] = useState<Date | null>(null);

  // Set the clock on the client only, so server and client render the same markup.
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  async function lookup(zipCode: string, utilityId?: string) {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ zip: zipCode, ...(utilityId ? { utility: utilityId } : {}) });
      const res = await fetch(`/api/utility?${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Lookup failed");
      setPlan(json.plan);
      setMonthlyKwh(json.plan.typicalMonthlyKwh);
    } catch (e) {
      setPlan(null);
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  function handleBill(bill: ParsedBill) {
    if (plan) setPlan(applyBillToPlan(plan, bill));
    const kwh = monthlyKwhFromBill(bill);
    if (kwh) setMonthlyKwh(kwh);
  }

  const zipValid = /^\d{5}$/.test(zip);

  return (
    <div className="space-y-6">
      <form
        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        onSubmit={(e) => {
          e.preventDefault();
          if (zipValid) lookup(zip);
        }}
      >
        <label htmlFor="zip" className="block text-sm font-medium text-slate-700">
          Enter your ZIP code
        </label>
        <div className="mt-2 flex flex-wrap gap-3">
          <input
            id="zip"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            placeholder="e.g. 94103"
            className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-lg tracking-widest text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
          />
          <button
            type="submit"
            disabled={!zipValid || loading}
            className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Finding your rates…" : "Show my rates"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
        {(plan || error) && (
          <p className="mt-3 text-sm text-slate-600">
            Wrong utility?{" "}
            <select
              aria-label="Choose your utility"
              className="mt-1 block w-full max-w-sm rounded border border-slate-300 px-2 py-1 text-sm sm:mt-0 sm:inline-block sm:w-auto"
              value={plan?.source === "curated" ? plan.utilityId : ""}
              onChange={(e) => e.target.value && zipValid && lookup(zip, e.target.value)}
            >
              <option value="">Choose your utility…</option>
              {utilities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.state} — {u.name}
                </option>
              ))}
            </select>
          </p>
        )}
      </form>

      {plan && now && (
        <>
          <RateSummary plan={plan} now={now} />
          <ApplianceCalculator plan={plan} monthlyKwh={monthlyKwh} onMonthlyKwhChange={setMonthlyKwh} />
          <BillConnect key={plan.utilityId} plan={plan} onBill={handleBill} />
        </>
      )}
    </div>
  );
}
