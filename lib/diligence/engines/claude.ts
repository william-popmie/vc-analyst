import Anthropic from "@anthropic-ai/sdk";
import { MODEL_ID, getAnthropicApiKey } from "@/lib/config";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/diligence/prompt";
import { SECTION_KEYS } from "@/lib/diligence/types";
import type {
  DiligenceEngine,
  DiligenceInput,
  DueDiligenceReport,
} from "@/lib/diligence/types";

const MAX_CONTINUATIONS = 4; // safety cap for the server-side web-search loop
const MAX_SEARCHES = 4; // bound research breadth to keep latency reasonable

// Shared request params. effort "low" keeps Opus fast for this research-heavy
// task (it still performs very well) and bounds web_search uses for latency.
const webSearchTool = {
  type: "web_search_20260209" as const,
  name: "web_search" as const,
  max_uses: MAX_SEARCHES,
};

/**
 * Claude implementation of the diligence engine: reads the deck, researches via
 * the native web_search tool, and returns a structured DueDiligenceReport.
 */
export class ClaudeDiligenceEngine implements DiligenceEngine {
  async run({ deckText, playbook }: DiligenceInput): Promise<DueDiligenceReport> {
    const client = new Anthropic({ apiKey: getAnthropicApiKey() });

    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: buildUserPrompt(deckText) },
    ];

    const system = buildSystemPrompt(playbook);
    const params = {
      model: MODEL_ID,
      max_tokens: 16000,
      system,
      tools: [webSearchTool],
      output_config: { effort: "medium" as const },
    };

    let response = await client.messages.create({ ...params, messages });

    // The web_search tool runs a server-side loop; it may pause with
    // stop_reason "pause_turn". Re-send to let it resume until it finishes.
    let continuations = 0;
    while (response.stop_reason === "pause_turn" && continuations < MAX_CONTINUATIONS) {
      messages.push({ role: "assistant", content: response.content });
      response = await client.messages.create({ ...params, messages });
      continuations += 1;
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return normalize(parseReport(text));
  }
}

/** Extract the JSON object from the model's final text, tolerating stray prose. */
function parseReport(text: string): Record<string, unknown> {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return a JSON report.");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

/** Defensive shaping so the frontend always gets a well-formed report. */
function normalize(raw: Record<string, unknown>): DueDiligenceReport {
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
