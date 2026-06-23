import type { LlmProvider, Provider } from "./types";
import { claudeProvider } from "./claude";
import { geminiProvider } from "./gemini";

export * from "./types";

/** Resolve a provider name to its adapter. The only place the two files meet. */
export function getProvider(name: Provider): LlmProvider {
  return name === "claude" ? claudeProvider : geminiProvider;
}
