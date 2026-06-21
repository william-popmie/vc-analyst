import type { DeckTextExtractor } from "./types";
import { embeddedTextExtractor } from "./embedded-text";
import { geminiVisionOcrExtractor } from "./gemini-vision-ocr";

export type { DeckTextExtractor } from "./types";

/**
 * The ordered extraction chain, cheapest/fastest first.
 *
 * `extractDeckText` tries each strategy in turn until one yields enough text.
 * To support a new kind of deck, write a `DeckTextExtractor` and add it here —
 * the orchestrator and the whole downstream pipeline stay untouched.
 */
export const DECK_TEXT_EXTRACTORS: DeckTextExtractor[] = [
  embeddedTextExtractor, // fast path: native text layer
  geminiVisionOcrExtractor, // fallback: Gemini vision OCR for image-only / scanned decks
];
