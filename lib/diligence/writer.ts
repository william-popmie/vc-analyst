import { getProvider } from "@/lib/llm";
import { getWriterProvider } from "@/lib/diligence/provider-config";
import {
  buildWriterSystemPrompt,
  buildWriterUserPrompt,
} from "@/lib/diligence/prompt";
import { normalize, parseReport } from "@/lib/diligence/parse";
import type {
  DiligenceInput,
  DueDiligenceReport,
  ResearchResult,
} from "@/lib/diligence/types";

export interface WriterInput extends DiligenceInput {
  research: ResearchResult;
}

/**
 * Stage 2 (generic) — synthesize the deck + research notes into the structured
 * report via the configured provider's ungrounded JSON generation. The shared
 * parse/normalize helpers turn the raw JSON text into a DueDiligenceReport.
 */
export async function writeReport({
  deckText,
  playbook,
  research,
}: WriterInput): Promise<DueDiligenceReport> {
  const text = await getProvider(getWriterProvider()).generateJson({
    system: buildWriterSystemPrompt(playbook),
    user: buildWriterUserPrompt(deckText, research),
  });
  return normalize(parseReport(text));
}
