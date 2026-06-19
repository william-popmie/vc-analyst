import { NextResponse } from "next/server";
import { extractDeckText } from "@/lib/pdf/extract";
import { loadPlaybook } from "@/lib/playbook/load";
import { getDiligenceEngine } from "@/lib/diligence/engine";
import { EmptyDeckError } from "@/lib/diligence/types";

export const runtime = "nodejs";
export const maxDuration = 300; // web research can take a while

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No PDF uploaded." }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const deckText = await extractDeckText(buffer);
    const playbook = loadPlaybook();

    const report = await getDiligenceEngine().run({ deckText, playbook });
    return NextResponse.json(report);
  } catch (err) {
    if (err instanceof EmptyDeckError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    if (err instanceof Error && err.message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        { error: "Server is missing its API key. Set ANTHROPIC_API_KEY." },
        { status: 500 },
      );
    }
    console.error("[analyze] failed:", err);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 },
    );
  }
}
