import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_ID, GEMINI_OCR_MODEL_ID, getGeminiApiKey } from "@/lib/config";
import type {
  GenerateArgs,
  LlmProvider,
  ResearchArgs,
  ResearchOutput,
  SystemPrompt,
  TokenUsage,
  WebSource,
} from "./types";
import type { GenerateContentResponseUsageMetadata } from "@google/genai";

// All Gemini-specific knobs live here and nowhere else.
const OCR_MAX_TOKENS = 16000;
// The field-fill passes emit a long NDJSON document. Gemini 2.5 Flash has
// "thinking" ON by default, which spends the output-token budget on hidden
// reasoning and can truncate the stream before the trailing fields (the
// scorecard) are written. Disable thinking and give the visible output a
// generous cap so the whole document always lands.
const GENERATE_MAX_TOKENS = 16000;

function ai(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: getGeminiApiKey() });
}

/** Normalize a Gemini `usageMetadata` object to the provider-agnostic shape. */
function usageOf(usage: GenerateContentResponseUsageMetadata | undefined, model: string): TokenUsage {
  return {
    inputTokens: usage?.promptTokenCount ?? 0,
    outputTokens: usage?.candidatesTokenCount ?? 0,
    cacheReadTokens: usage?.cachedContentTokenCount ?? 0,
    cacheCreationTokens: 0,
    model,
    provider: "gemini",
  };
}

/**
 * Gemini has no explicit cache_control here, so a SystemPrompt's blocks are
 * just joined back into one string in order — same content, same behavior.
 */
function toSystemInstruction(system: SystemPrompt): string {
  if (typeof system === "string") return system;
  return system.map((b) => b.text).join("\n\n");
}

/** Google Gemini adapter — translates the generic capabilities to the SDK. */
export const geminiProvider: LlmProvider = {
  name: "gemini",

  async transcribePdf(pdf, instruction, onUsage) {
    const response = await ai().models.generateContent({
      model: GEMINI_OCR_MODEL_ID,
      contents: [
        { inlineData: { mimeType: "application/pdf", data: pdf.toString("base64") } },
        { text: instruction },
      ],
      // Thinking off — the whole budget goes to the transcription.
      config: { maxOutputTokens: OCR_MAX_TOKENS, thinkingConfig: { thinkingBudget: 0 } },
    });
    onUsage?.(usageOf(response.usageMetadata, GEMINI_OCR_MODEL_ID));
    return (response.text ?? "").trim();
  },

  async researchWeb({ system, user, onSearch, onSource, onText, onUsage }): Promise<ResearchOutput> {
    const stream = await ai().models.generateContentStream({
      model: GEMINI_MODEL_ID,
      contents: user,
      // Google Search grounding — the equivalent of Claude's web_search.
      config: { systemInstruction: toSystemInstruction(system), tools: [{ googleSearch: {} }] },
    });

    const sources: WebSource[] = [];
    const seenQueries = new Set<string>();
    const seenSources = new Set<string>();
    let findings = "";
    let lastFinish: string | undefined;
    let lastUsage: GenerateContentResponseUsageMetadata | undefined;

    for await (const chunk of stream) {
      if (chunk.candidates?.[0]?.finishReason) lastFinish = chunk.candidates[0].finishReason;
      if (chunk.usageMetadata) lastUsage = chunk.usageMetadata;
      if (chunk.text) {
        findings += chunk.text;
        onText?.(chunk.text); // surface findings prose live (observational only)
      }

      // Grounding metadata arrives near the end of the stream (a burst), not
      // live per-query like Claude. Source URLs are Google redirect links.
      const grounding = chunk.candidates?.[0]?.groundingMetadata;
      if (!grounding) continue;

      for (const query of grounding.webSearchQueries ?? []) {
        if (!query || seenQueries.has(query)) continue;
        seenQueries.add(query);
        onSearch?.(query);
      }
      for (const groundingChunk of grounding.groundingChunks ?? []) {
        const web = groundingChunk.web;
        if (!web?.uri || seenSources.has(web.uri)) continue;
        seenSources.add(web.uri);
        const source: WebSource = { title: web.title ?? web.uri, url: web.uri };
        sources.push(source);
        onSource?.(source);
      }
    }

    console.log(`[gemini.researchWeb] finish=${lastFinish} findingsLen=${findings.length} queries=${seenQueries.size} sources=${sources.length}`);
    onUsage?.(usageOf(lastUsage, GEMINI_MODEL_ID));
    return { findings: findings.trim(), sources };
  },

  async generateStream({ system, user, onText, onUsage }) {
    // No tools — stream plain text (the pipeline parses NDJSON field lines). We
    // deliberately don't set responseMimeType json: the output is many JSON
    // lines, not one object.
    const stream = await ai().models.generateContentStream({
      model: GEMINI_MODEL_ID,
      contents: user,
      config: {
        systemInstruction: toSystemInstruction(system),
        maxOutputTokens: GENERATE_MAX_TOKENS,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    let text = "";
    let lastUsage: GenerateContentResponseUsageMetadata | undefined;
    for await (const chunk of stream) {
      if (chunk.usageMetadata) lastUsage = chunk.usageMetadata;
      if (chunk.text) {
        text += chunk.text;
        onText?.(chunk.text);
      }
    }
    onUsage?.(usageOf(lastUsage, GEMINI_MODEL_ID));
    return text.trim();
  },
};
