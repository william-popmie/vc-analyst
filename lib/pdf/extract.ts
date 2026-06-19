import { EmptyDeckError } from "@/lib/diligence/types";

const MIN_DECK_CHARS = 80;

/**
 * Extract text from a pitch-deck PDF buffer. Uses unpdf, which ships a
 * serverless/Node-compatible pdf.js build (no DOM / DOMMatrix needed).
 * Throws EmptyDeckError when the result is too short (image-only / scanned
 * decks) so the UI can show a friendly message instead of feeding noise.
 */
export async function extractDeckText(buffer: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });

  const cleaned = (Array.isArray(text) ? text.join("\n") : text).trim();
  if (cleaned.length < MIN_DECK_CHARS) {
    throw new EmptyDeckError();
  }
  return cleaned;
}
