import { NextResponse } from "next/server";
import { lookupOpenEi } from "@/lib/openei";
import type { UtilityLookupResult } from "@/lib/types";
import { findUtilityIdForZip, getCuratedPlan, isValidZip } from "@/lib/utilities";

// GET /api/utility?zip=94103[&utility=pge]
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zip = (searchParams.get("zip") ?? "").trim();
  const override = searchParams.get("utility");

  if (!isValidZip(zip)) {
    return NextResponse.json({ error: "Please enter a valid 5-digit ZIP code." }, { status: 400 });
  }

  const curatedId = override ?? findUtilityIdForZip(zip);
  const curated = curatedId ? getCuratedPlan(curatedId) : null;
  if (curated) {
    return NextResponse.json({ zip, plan: curated } satisfies UtilityLookupResult);
  }

  const apiKey = process.env.OPENEI_API_KEY;
  if (apiKey) {
    try {
      const plan = await lookupOpenEi(zip, apiKey);
      if (plan) return NextResponse.json({ zip, plan } satisfies UtilityLookupResult);
    } catch (err) {
      console.error("OpenEI lookup failed", err);
    }
  }

  return NextResponse.json(
    { error: "We don't cover this ZIP code yet. Pick your utility below, or upload a bill to get started." },
    { status: 404 },
  );
}
