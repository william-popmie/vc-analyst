import { GoogleGenAI } from "@google/genai";
import { GEMINI_OCR_MODEL_ID, getGeminiApiKey } from "@/lib/config";
import type { DeckTextExtractor } from "./types";

const OCR_MAX_TOKENS = 16000;

const OCR_INSTRUCTION = [
  "This PDF is a startup pitch deck whose text is not machine-extractable",
  "(it's image-only or scanned). Transcribe ALL of its text content, slide by",
  "slide, into plain text. Preserve the reading order and keep numbers, metrics,",
  "names, and labels exactly as shown. Include chart/table values and any text",
  "embedded in images. Do not summarize, interpret, or add commentary — output",
  "only the transcribed text.",
].join(" ");

/**
 * Robust fallback: hand the whole PDF to Google Gemini's native document/vision
 * understanding (sent as an inline base64 PDF part) and transcribe it to plain
 * text. Handles image-only / scanned decks that have no extractable text layer.
 * Thinking is disabled so the full output budget goes to the transcription.
 */
export const geminiVisionOcrExtractor: DeckTextExtractor = {
  name: "gemini-vision-ocr",
  async extract(buffer: Buffer): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const data = buffer.toString("base64");

    const response = await ai.models.generateContent({
      model: GEMINI_OCR_MODEL_ID,
      contents: [
        { inlineData: { mimeType: "application/pdf", data } },
        { text: OCR_INSTRUCTION },
      ],
      config: {
        maxOutputTokens: OCR_MAX_TOKENS,
        // Pure transcription — no need to "think", and it would eat the budget.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    return (response.text ?? "").trim();
  },
};
