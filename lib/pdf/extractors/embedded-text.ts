import type { DeckTextExtractor } from "./types";

/**
 * Fast path: pull the PDF's embedded text layer via unpdf, which ships a
 * serverless/Node-compatible pdf.js build (no DOM / DOMMatrix needed).
 *
 * Returns "" for image-only / scanned decks that carry no text layer, letting
 * the orchestrator fall through to a heavier strategy.
 */
export const embeddedTextExtractor: DeckTextExtractor = {
  name: "embedded-text",
  async extract(buffer: Buffer): Promise<string> {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return (Array.isArray(text) ? text.join("\n") : text).trim();
  },
};
