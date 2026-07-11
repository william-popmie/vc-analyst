import { getProvider } from "@/lib/llm";
import { getOcrProvider } from "@/lib/diligence/provider-config";
import { OCR_INSTRUCTION } from "./instruction";
import type { DeckTextExtractor } from "./types";

/**
 * Generic vision-OCR fallback for image-only / scanned decks. Provider-agnostic:
 * it hands the PDF to whichever provider OCR_PROVIDER selects via the LlmProvider
 * boundary. Selected after the free embedded-text strategy.
 */
export const visionOcrExtractor: DeckTextExtractor = {
  name: "vision-ocr",
  extract(buffer, onUsage) {
    return getProvider(getOcrProvider()).transcribePdf(buffer, OCR_INSTRUCTION, onUsage);
  },
};
