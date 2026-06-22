/**
 * Validated configuration. The API key is read at call time (not import time)
 * so the Vercel build stays green even when the var isn't present at build.
 */

// The single model id used by the diligence engine. Swap here to change models.
// Sonnet 4.6 is fast + cost-effective for this public-facing research task and
// supports the native web_search tool with dynamic filtering.
export const MODEL_ID = "claude-sonnet-4-6";

// Model used only to OCR/transcribe image-only PDFs into text before they enter
// the pipeline. Transcription is a simpler task than the diligence research, so
// a fast model keeps this preprocessing step cheap and quick.
export const OCR_MODEL_ID = "claude-sonnet-4-6";

// Gemini model used to OCR image-only PDFs. 2.5 Flash reads PDFs natively (it
// transcribes scanned/image slides) and is fast + cost-effective.
export const GEMINI_OCR_MODEL_ID = "gemini-2.5-flash";

export function getAnthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (see .env.example).",
    );
  }
  return key;
}

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local (see .env.example).",
    );
  }
  return key;
}
