import { ClaudeDiligenceEngine } from "@/lib/diligence/engines/claude";
import { GeminiDiligenceEngine } from "@/lib/diligence/engines/gemini";
import type { DiligenceEngine } from "@/lib/diligence/types";

/**
 * Single switch point for the research engine. The provider is chosen by the
 * LLM_PROVIDER env var (default "gemini"); both implementations honor the same
 * DiligenceEngine contract, so the API route and UI never change.
 */
export function getDiligenceEngine(): DiligenceEngine {
  const provider = (process.env.LLM_PROVIDER ?? "gemini").toLowerCase();
  return provider === "claude"
    ? new ClaudeDiligenceEngine()
    : new GeminiDiligenceEngine();
}
