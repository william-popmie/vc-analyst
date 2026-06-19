/**
 * Validated configuration. The API key is read at call time (not import time)
 * so the Vercel build stays green even when the var isn't present at build.
 */

// The single model id used by the diligence engine. Swap here to change models.
// Sonnet 4.6 is fast + cost-effective for this public-facing research task and
// supports the native web_search tool with dynamic filtering.
export const MODEL_ID = "claude-sonnet-4-6";

export function getAnthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (see .env.example).",
    );
  }
  return key;
}
