"use client";

import { useState } from "react";
import { effectiveRate, type ParsedBill } from "@/lib/bill";
import { centsPerKwh, usd } from "@/lib/calc";
import type { UtilityRatePlan } from "@/lib/types";

export function BillConnect({ plan, onBill }: { plan: UtilityRatePlan; onBill: (bill: ParsedBill) => void }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [bill, setBill] = useState<ParsedBill | null>(null);

  async function upload(file: File) {
    setStatus("uploading");
    setError(null);
    const body = new FormData();
    body.append("bill", file);
    try {
      const res = await fetch("/api/bill", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setBill(json.bill);
      onBill(json.bill);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setStatus("error");
    }
  }

  const rate = bill ? effectiveRate(bill) : null;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold text-slate-900">Get numbers from your real bill</h2>
      <p className="mt-1 text-sm text-slate-600">Swap our estimates for your actual usage and rates.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="font-medium text-slate-900">Connect your utility account</p>
          {plan.connect.type === "green-button" ? (
            <>
              <p className="mt-1 text-sm text-slate-600">{plan.utilityName} supports Green Button data sharing.</p>
              <button disabled className="mt-3 cursor-not-allowed rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500" title="Direct connection is coming soon">
                Connect (coming soon)
              </button>
              <a className="mt-2 block text-xs text-slate-500 underline" href={plan.connect.portalUrl} target="_blank" rel="noreferrer">
                Learn about {plan.utilityName.split(" (")[0]} data sharing
              </a>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-600">{plan.utilityName} doesn&apos;t offer a data connection we support yet. Upload a bill instead.</p>
          )}
        </div>

        <label className="flex cursor-pointer flex-col rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-4 hover:bg-emerald-50">
          <span className="font-medium text-slate-900">Upload a bill (PDF or photo)</span>
          <span className="mt-1 text-sm text-slate-600">We read your usage, plan, and rates automatically.</span>
          <span className="mt-3 inline-block w-fit rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
            {status === "uploading" ? "Reading your bill…" : "Choose file"}
          </span>
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={status === "uploading"}
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </label>
      </div>

      {error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {bill && (
        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">
            {bill.utilityName}
            {bill.ratePlan ? ` · ${bill.ratePlan}` : ""}
            {bill.billingPeriodStart && bill.billingPeriodEnd ? ` · ${bill.billingPeriodStart} to ${bill.billingPeriodEnd}` : ""}
          </p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-3">
            <li>Usage: {bill.totalKwh ?? "—"} kWh</li>
            <li>Electric charges: {bill.totalElectricCharges != null ? usd(bill.totalElectricCharges) : "—"}</li>
            <li>Your effective rate: {rate ? centsPerKwh(rate) : "—"}</li>
          </ul>
          {bill.touBreakdown.length > 0 && (
            <ul className="mt-2 list-inside list-disc">
              {bill.touBreakdown.map((r) => (
                <li key={r.period}>
                  {r.period}: {r.kwh ?? "—"} kWh{r.pricePerKwh ? ` at ${centsPerKwh(r.pricePerKwh)}` : ""}
                  {r.hours ? ` (${r.hours})` : ""}
                </li>
              ))}
            </ul>
          )}
          {bill.notes && <p className="mt-2 text-xs text-slate-500">{bill.notes}</p>}
          <p className="mt-2 text-xs text-emerald-700">Calculator updated with your bill&apos;s usage{bill.touBreakdown.some((r) => r.pricePerKwh) ? " and rates" : ""}.</p>
        </div>
      )}
    </section>
  );
}
