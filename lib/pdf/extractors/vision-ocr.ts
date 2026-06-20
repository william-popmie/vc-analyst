import Anthropic from "@anthropic-ai/sdk";
import { OCR_MODEL_ID, getAnthropicApiKey } from "@/lib/config";
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
 * Robust fallback: hand the whole PDF to Claude's native vision OCR (sent as a
 * base64 `document` content block) and transcribe it to plain text. Handles
 * image-only / scanned decks — exported-from-Figma/Canva/Keynote, photographed,
 * etc. — that have no extractable text layer. No native binaries, so it runs
 * anywhere (incl. Vercel); Claude does the OCR server-side.
 */
export const visionOcrExtractor: DeckTextExtractor = {
  name: "vision-ocr",
  async extract(buffer: Buffer): Promise<string> {
    const client = new Anthropic({ apiKey: getAnthropicApiKey() });
    const data = buffer.toString("base64");

    // Stream to avoid HTTP timeouts on long transcriptions; we only need text.
    const stream = client.messages.stream({
      model: OCR_MODEL_ID,
      max_tokens: OCR_MAX_TOKENS,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data },
            },
            { type: "text", text: OCR_INSTRUCTION },
          ],
        },
      ],
    });

    const message = await stream.finalMessage();

    return message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
  },
};
