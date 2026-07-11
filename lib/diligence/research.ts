import { getProvider } from "@/lib/llm";
import { costOf } from "@/lib/llm/pricing";
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

/** What the deck pass already learned, so research can target the gaps. */
export interface ResearchContext {
  companyName: string;
  /** Labels of fields still empty after the deck pass. */
  gaps: string[];
}

/**
 * Web-research stage (generic) — researches the company via the configured
 * provider's web search and forwards the provider's query/source/text callbacks
 * as ProgressEvents. Targets the still-missing fields so facts that are "one
 * search away" actually get found. The engine owns the phase status; this only
 * emits the search/source/note activity.
 */
export async function research(
  { deckText, playbook }: DiligenceInput,
  onEvent?: ProgressCallback,
  ctx?: ResearchContext,
): Promise<ResearchResult> {
  const emit: ProgressCallback = onEvent ?? (() => {});

  return getProvider(getResearchProvider()).researchWeb({
    system: buildResearchSystemPrompt(playbook, deckText),
    user: buildResearchUserPrompt(ctx?.companyName ?? "", ctx?.gaps ?? []),
    onSearch: (query) => emit({ type: "search", query }),
    onSource: (source) => emit({ type: "source", ...source }),
    onText: (text) => emit({ type: "note", text }),
    onUsage: (usage) => emit({ type: "usage", stage: "research", usage, costUsd: costOf(usage) }),
  });
}
