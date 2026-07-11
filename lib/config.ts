/**
 * Validated configuration. The API key is read at call time (not import time)
 * so the Vercel build stays green even when the var isn't present at build.
 */

// The Claude model id used by the Claude diligence engine.
// Temporarily set to Haiku 4.5 for a speed test — fastest/cheapest tier.
// Haiku *does* support the web_search tool, but needs `allowed_callers:
// ["direct"]` explicitly set on the tool (lib/llm/claude.ts) since it can't do
// programmatic tool calling like Sonnet/Opus, and it rejects `output_config.
// effort` outright (also handled in claude.ts). Swap back to
// "claude-sonnet-4-6" to restore the previous quality/speed balance.
export const MODEL_ID = "claude-haiku-4-5";

// Gemini model used by the Gemini diligence engine. 2.5 Flash is fast +
// cost-effective and supports Google Search grounding (the equivalent of
// Claude's web_search).
export const GEMINI_MODEL_ID = "gemini-2.5-flash";

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
