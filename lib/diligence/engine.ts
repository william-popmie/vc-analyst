import { ClaudeDiligenceEngine } from "@/lib/diligence/engines/claude";
import type { DiligenceEngine } from "@/lib/diligence/types";

/**
 * Single switch point for the research engine. Swap Claude for a custom engine
 * later without touching the API route or the UI.
 */
export function getDiligenceEngine(): DiligenceEngine {
  return new ClaudeDiligenceEngine();
}
