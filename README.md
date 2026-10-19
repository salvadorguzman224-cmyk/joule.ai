# joule.ai

Help households lower their electricity bill. Free MVP flow:

1. **Enter a ZIP code** → we detect the electric utility serving it.
2. **See peak hours and price per kWh** → a 24-hour timeline of peak / off-peak / super off-peak, plus what you're paying right now.
3. **Appliance cost calculator** → what a load of laundry, a dryer cycle, or a dishwasher run costs at peak vs. off-peak, and an estimated monthly bill both ways.
4. **Use your real bill** → connect your utility (Green Button, coming soon) or upload a PDF/photo of a bill; Claude extracts usage and rates and the calculator updates.

## Run locally

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY to enable bill scanning
npm run dev                  # http://localhost:3000
npm test                     # unit tests (ZIP lookup, cost math, OpenEI parsing, bill helpers)
```

## Deploy to Google Cloud Run

From [Cloud Shell](https://shell.cloud.google.com) (no local install needed):

```bash
git clone -b claude/nifty-ride-rf99q8 https://github.com/salvadorguzman224-cmyk/joule.ai.git && cd joule.ai
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
printf '%s' 'YOUR_ANTHROPIC_KEY' | gcloud secrets create anthropic-api-key --data-file=-
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
gcloud run deploy joule-ai --source . --region us-central1 --allow-unauthenticated \
  --set-secrets=ANTHROPIC_API_KEY=anthropic-api-key:latest
```

The `Dockerfile` builds a standalone Next.js server listening on port 8080.

## How it works

| Piece | Where |
| --- | --- |
| Curated utility plans + ZIP → utility map | `src/lib/utilities.ts` |
| Nationwide fallback via OpenEI Utility Rate Database (`OPENEI_API_KEY`) | `src/lib/openei.ts` |
| Peak/off-peak math, appliance & bill estimates | `src/lib/calc.ts` |
| Bill extraction schema + overlay of bill rates | `src/lib/bill.ts` |
| `GET /api/utility?zip=` | `src/app/api/utility/route.ts` |
| `POST /api/bill` (multipart `bill`) | `src/app/api/bill/route.ts` |
| UI | `src/components/` |

Coverage today: PG&E, SCE, SDG&E, LADWP, Con Edison, ComEd, FPL, Georgia Power, APS, Xcel (CO), and Oncor/DFW. Other ZIPs use OpenEI when a key is set; otherwise users can pick their utility or upload a bill.

**Rates are estimates.** Curated prices are approximate all-in summer residential TOU rates. Verify them against each utility's tariff page before launch and refresh `RATES_AS_OF` in `src/lib/utilities.ts`.

## Next steps

- Direct utility connection: Green Button Connect / an aggregator such as UtilityAPI or Arcadia.
- Season-aware rates (summer vs. winter) and tiered/baseline pricing.
- Precise ZIP→utility mapping (EIA-861 service territories) instead of 3-digit prefixes.
- Save results and send off-peak reminders.
