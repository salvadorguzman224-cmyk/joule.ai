import { JouleApp } from "@/components/JouleApp";
import { listCuratedUtilities } from "@/lib/utilities";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-emerald-700">joule.ai · free</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Stop paying peak prices for your electricity.</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600">
          Enter your ZIP code to see your utility&apos;s peak hours, what you pay per kWh, and how much you save by running laundry and dishes at the right time.
        </p>
      </header>
      <JouleApp utilities={listCuratedUtilities()} />
      <footer className="mt-12 text-xs text-slate-500">
        Estimates only. Rates vary by plan, season, and tier; taxes and fees not included.
      </footer>
    </main>
  );
}
