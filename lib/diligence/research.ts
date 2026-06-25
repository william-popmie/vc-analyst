import { getProvider } from "@/lib/llm";
import { getResearchProvider } from "@/lib/diligence/provider-config";
import {
  buildResearchSystemPrompt,
  buildResearchUserPrompt,
} from "@/lib/diligence/prompt";
import type {
  DiligenceInput,
  ProgressCallback,
  ResearchResult,
} from "@/lib/diligence/types";

/**
 * Web-research stage (generic) — researches the company via the configured
 * provider's web search and forwards the provider's query/source/text callbacks
 * as ProgressEvents. The engine owns the phase status; this only emits the
 * search/source/note activity.
 */
export async function research(
  { deckText, playbook }: DiligenceInput,
  onEvent?: ProgressCallback,
): Promise<ResearchResult> {
  const emit: ProgressCallback = onEvent ?? (() => {});

  return getProvider(getResearchProvider()).researchWeb({
    system: buildResearchSystemPrompt(playbook),
    user: buildResearchUserPrompt(deckText),
    onSearch: (query) => emit({ type: "search", query }),
    onSource: (source) => emit({ type: "source", ...source }),
    onText: (text) => emit({ type: "note", text }),
  });
}
