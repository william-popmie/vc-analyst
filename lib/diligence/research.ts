import { getProvider } from "@/lib/llm";
import { costOf } from "@/lib/llm/pricing";
import { getResearchProvider, getWriterProvider } from "@/lib/diligence/provider-config";
import {
  buildAnalyzeSystemPrompt,
  buildAnalyzeUserPrompt,
  buildSearchSystemPrompt,
  buildSearchUserPrompt,
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
 * Web-research stage (generic) — two sequential steps against the shared,
 * cached deck+playbook context:
 *   1. search  — the provider's web search tool collects raw, source-attributed
 *      facts (no synthesis), forwarding query/source ProgressEvents live.
 *   2. analyze — an ungrounded pass (writer provider) synthesizes those raw
 *      facts into prose research notes, streamed live as `note` events.
 * Splitting keeps the search stage's tool-loop cache reuse isolated from the
 * no-tools cache line shared by extract/analyze/complete/scorecard/feedback,
 * and gives each step its own line in the token/cost breakdown.
 */
export async function research(
  { deckText, playbook }: DiligenceInput,
  onEvent?: ProgressCallback,
  ctx?: ResearchContext,
): Promise<ResearchResult> {
  const emit: ProgressCallback = onEvent ?? (() => {});

  const searchResult = await getProvider(getResearchProvider()).researchWeb({
    system: buildSearchSystemPrompt(playbook, deckText),
    user: buildSearchUserPrompt(ctx?.companyName ?? "", ctx?.gaps ?? []),
    onSearch: (query) => emit({ type: "search", query }),
    onSource: (source) => emit({ type: "source", ...source }),
    onUsage: (usage) => emit({ type: "usage", stage: "search", usage, costUsd: costOf(usage) }),
  });

  const findings = await getProvider(getWriterProvider()).generateStream({
    system: buildAnalyzeSystemPrompt(playbook, deckText),
    user: buildAnalyzeUserPrompt(searchResult.findings, searchResult.sources),
    onText: (text) => emit({ type: "note", text }),
    onUsage: (usage) => emit({ type: "usage", stage: "analyze", usage, costUsd: costOf(usage) }),
  });

  return { findings, sources: searchResult.sources };
}
