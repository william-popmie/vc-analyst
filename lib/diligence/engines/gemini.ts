import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_ID, getGeminiApiKey } from "@/lib/config";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/diligence/prompt";
import { normalize, parseReport } from "@/lib/diligence/parse";
import type {
  DiligenceEngine,
  DiligenceInput,
  DueDiligenceReport,
  ProgressCallback,
} from "@/lib/diligence/types";

/**
 * Google Gemini implementation of the diligence engine. Mirrors the Claude
 * engine: reads the deck, researches via Google Search grounding, and returns a
 * structured DueDiligenceReport — emitting the same provider-agnostic
 * ProgressEvents so the API route and UI need no changes.
 *
 * Unlike Claude's web_search (which streams a block per search as it fires),
 * Gemini resolves grounding server-side in a single turn and returns the queries
 * + sources in `groundingMetadata`, which arrives toward the end of the stream.
 * So the search/source events tend to land in a burst near the end.
 */
export class GeminiDiligenceEngine implements DiligenceEngine {
  async run(
    { deckText, playbook }: DiligenceInput,
    onEvent?: ProgressCallback,
  ): Promise<DueDiligenceReport> {
    const emit: ProgressCallback = onEvent ?? (() => {});
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

    emit({ type: "status", phase: "reading", message: "Reading the deck" });

    const stream = await ai.models.generateContentStream({
      model: GEMINI_MODEL_ID,
      contents: buildUserPrompt(deckText),
      config: {
        systemInstruction: buildSystemPrompt(playbook),
        // Google Search grounding — the Gemini equivalent of Claude's web_search.
        tools: [{ googleSearch: {} }],
      },
    });

    // De-dupe across the whole run so we never report the same query/URL twice.
    const seenQueries = new Set<string>();
    const seenSources = new Set<string>();
    let researching = false;
    let text = "";

    for await (const chunk of stream) {
      if (chunk.text) text += chunk.text;

      const grounding = chunk.candidates?.[0]?.groundingMetadata;
      if (!grounding) continue;

      if (!researching) {
        researching = true;
        emit({ type: "status", phase: "researching", message: "Researching online" });
      }

      for (const query of grounding.webSearchQueries ?? []) {
        if (!query || seenQueries.has(query)) continue;
        seenQueries.add(query);
        emit({ type: "search", query });
      }

      for (const groundingChunk of grounding.groundingChunks ?? []) {
        const web = groundingChunk.web;
        if (!web?.uri || seenSources.has(web.uri)) continue;
        seenSources.add(web.uri);
        emit({ type: "source", title: web.title ?? web.uri, url: web.uri });
      }
    }

    emit({ type: "status", phase: "synthesizing", message: "Writing the due diligence report" });

    const report = normalize(parseReport(text.trim()));
    emit({ type: "status", phase: "done", message: "Report ready" });
    return report;
  }
}
