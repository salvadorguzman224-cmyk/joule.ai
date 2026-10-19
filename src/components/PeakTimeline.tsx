import { formatHour, periodAtHour } from "@/lib/calc";
import type { PeriodKind, UtilityRatePlan } from "@/lib/types";

export const KIND_STYLES: Record<PeriodKind, { bar: string; dot: string }> = {
  peak: { bar: "bg-rose-500", dot: "bg-rose-500" },
  offPeak: { bar: "bg-amber-300", dot: "bg-amber-300" },
  superOffPeak: { bar: "bg-emerald-500", dot: "bg-emerald-500" },
};

export function PeakTimeline({ plan, nowHour }: { plan: UtilityRatePlan; nowHour?: number }) {
  const hours = Array.from({ length: 24 }, (_, h) => ({ h, period: periodAtHour(plan, h) }));
  return (
    <div>
      <div className="flex h-10 overflow-hidden rounded-lg ring-1 ring-black/5" role="img" aria-label="24-hour rate timeline">
        {hours.map(({ h, period }) => (
          <div
            key={h}
            title={`${formatHour(h)}: ${period.label}`}
            className={`relative flex-1 ${KIND_STYLES[period.kind].bar} ${h > 0 ? "border-l border-white/40" : ""}`}
          >
            {nowHour === h && <span className="absolute inset-x-0 -top-1 mx-auto h-12 w-0.5 bg-slate-900" aria-label="Now" />}
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        {[0, 6, 12, 18, 24].map((h) => (
          <span key={h}>{formatHour(h)}</span>
        ))}
      </div>
    </div>
  );
}
