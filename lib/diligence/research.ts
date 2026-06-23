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
 * Stage 1 (generic) — research the company via the configured provider's web
 * search, forwarding the provider's query/source callbacks as ProgressEvents.
 * Provider-agnostic: it only talks to the LlmProvider boundary.
 */
export async function research(
  { deckText, playbook }: DiligenceInput,
  onEvent?: ProgressCallback,
): Promise<ResearchResult> {
  const emit: ProgressCallback = onEvent ?? (() => {});
  emit({ type: "status", phase: "reading", message: "Reading the deck" });

  let researching = false;

  return getProvider(getResearchProvider()).researchWeb({
    system: buildResearchSystemPrompt(playbook),
    user: buildResearchUserPrompt(deckText),
    onSearch: (query) => {
      if (!researching) {
        researching = true;
        emit({ type: "status", phase: "researching", message: "Researching online" });
      }
      emit({ type: "search", query });
    },
    onSource: (source) => emit({ type: "source", ...source }),
  });
}
