import { SECTION_KEYS } from "@/lib/diligence/types";
import type { DueDiligenceReport } from "@/lib/diligence/types";

/**
 * Shared report-shaping helpers used by every engine. The model is instructed to
 * emit a single JSON object; these turn that (possibly messy) text into a
 * well-formed `DueDiligenceReport` the frontend can render safely.
 */

/** Extract the JSON object from the model's final text, tolerating stray prose. */
export function parseReport(text: string): Record<string, unknown> {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return a JSON report.");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

/** Defensive shaping so the frontend always gets a well-formed report. */
export function normalize(raw: Record<string, unknown>): DueDiligenceReport {
  const company = (raw.company ?? {}) as Record<string, unknown>;
  const overall = (raw.overall ?? {}) as Record<string, unknown>;
  const sections = Array.isArray(raw.sections) ? (raw.sections as Record<string, unknown>[]) : [];
  const sources = Array.isArray(raw.sources) ? (raw.sources as Record<string, unknown>[]) : [];

  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];
  const num = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(10, Math.max(1, n)) : 0;
  };
  const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

  return {
    company: {
      name: str(company.name) ?? "Unknown company",
      oneLiner: str(company.oneLiner) ?? "",
      sector: str(company.sector),
      stage: str(company.stage),
      location: str(company.location),
      website: str(company.website),
    },
    overall: {
      score: num(overall.score),
      recommendation: str(overall.recommendation) ?? "No recommendation",
      thesis: str(overall.thesis) ?? "",
      topStrengths: arr(overall.topStrengths),
      topConcerns: arr(overall.topConcerns),
    },
    sections: sections
      .map((s) => ({
        key: String(s.key) as DueDiligenceReport["sections"][number]["key"],
        title: str(s.title) ?? String(s.key),
        score: num(s.score),
        summary: str(s.summary) ?? "",
        fromDeck: arr(s.fromDeck),
        fromResearch: arr(s.fromResearch),
        greenFlags: arr(s.greenFlags),
        redFlags: arr(s.redFlags),
        questionsAVCWouldAsk: arr(s.questionsAVCWouldAsk),
      }))
      .filter((s) => (SECTION_KEYS as readonly string[]).includes(s.key)),
    sources: sources
      .map((s) => ({ title: str(s.title) ?? str(s.url) ?? "", url: str(s.url) ?? "" }))
      .filter((s) => s.url),
    generatedAt: new Date().toISOString(),
  };
}
