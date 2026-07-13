import type { TokenUsage } from "./types";

/**
 * $ per token, by model. The single place to update when a model or its price
 * changes — `costOf` just looks up the row and does the arithmetic.
 */
interface Rate {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

const PER_MILLION: Record<string, Rate> = {
  "claude-sonnet-4-6": { input: 3.0, output: 15.0, cacheRead: 0.3, cacheWrite: 3.75 },
  // Gemini rates are best-effort from public pricing, not fetched live — update
  // if Google's rate card changes.
  "gemini-2.5-flash": { input: 0.3, output: 2.5, cacheRead: 0.075, cacheWrite: 0.3 },
};

/** $ per web search performed by the server-side web_search tool. */
const WEB_SEARCH_COST = 0.01;

export function costOf(usage: TokenUsage): number {
  const rate = PER_MILLION[usage.model];
  if (!rate) return 0;

  const tokenCost =
    (usage.inputTokens * rate.input +
      usage.outputTokens * rate.output +
      usage.cacheReadTokens * rate.cacheRead +
      usage.cacheCreationTokens * rate.cacheWrite) /
    1_000_000;

  return tokenCost + (usage.webSearches ?? 0) * WEB_SEARCH_COST;
}

/**
 * $ saved by reading `cacheReadTokens` from cache instead of paying the full
 * input rate for them. Zero for unknown models or when nothing was cached.
 */
export function cacheSavingsOf(usage: TokenUsage): number {
  const rate = PER_MILLION[usage.model];
  if (!rate) return 0;

  return (usage.cacheReadTokens * (rate.input - rate.cacheRead)) / 1_000_000;
}
