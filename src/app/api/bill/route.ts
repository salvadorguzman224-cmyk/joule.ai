import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import { ACCEPTED_BILL_TYPES, type AcceptedBillType, BillSchema, MAX_BILL_BYTES } from "@/lib/bill";

export const runtime = "nodejs";
export const maxDuration = 120;

const SYSTEM = `You read U.S. residential electricity bills and extract structured data.
Only report values printed on the bill; use null when a value is missing or unreadable rather than estimating.
If the bill covers gas and electric, report electric only.`;

// POST /api/bill  (multipart/form-data, field "bill": PDF or image)
export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Bill scanning isn't configured (missing ANTHROPIC_API_KEY)." }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("bill");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attach your bill as a PDF or photo." }, { status: 400 });
  }
  if (!ACCEPTED_BILL_TYPES.includes(file.type as AcceptedBillType)) {
    return NextResponse.json({ error: "Upload a PDF, PNG, JPEG or WebP file." }, { status: 415 });
  }
  if (file.size > MAX_BILL_BYTES) {
    return NextResponse.json({ error: "File is too large (10 MB max)." }, { status: 413 });
  }

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const source =
    file.type === "application/pdf"
      ? ({ type: "document", source: { type: "base64", media_type: "application/pdf", data } } as const)
      : ({ type: "image", source: { type: "base64", media_type: file.type as Exclude<AcceptedBillType, "application/pdf">, data } } as const);

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(BillSchema) },
      system: SYSTEM,
      messages: [{ role: "user", content: [source, { type: "text", text: "Extract the electricity details from this bill." }] }],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return NextResponse.json({ error: "We couldn't read that bill. Try a clearer scan or the PDF from your utility's website." }, { status: 422 });
    }
    return NextResponse.json({ bill: response.parsed_output });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "We're busy right now — please try again in a minute." }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("Bill parse failed", err.status, err.message);
      return NextResponse.json({ error: "Bill scanning failed. Please try again." }, { status: 502 });
    }
    throw err;
  }
}
