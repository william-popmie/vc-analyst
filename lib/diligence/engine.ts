import { computeGaps, emptyForm } from "@/lib/diligence/form-schema";
import { fillFields } from "@/lib/diligence/fill-fields";
import { scoreCard } from "@/lib/diligence/score";
import { reviewDeck } from "@/lib/diligence/feedback";
import { research } from "@/lib/diligence/research";
import { getWriterProvider } from "@/lib/diligence/provider-config";
import {
  buildCompleteSystemPrompt,
  buildCompleteUserPrompt,
  buildDeckExtractSystemPrompt,
  buildDeckExtractUserPrompt,
} from "@/lib/diligence/prompt";
import { predictInvest } from "@/lib/invest/model";
import type {
  DiligenceEngine,
  DiligenceInput,
  DueDiligenceForm,
  ProgressCallback,
} from "@/lib/diligence/types";

/**
 * The diligence pipeline, all stages streaming into one live-filling form:
 *   1. extract  — fill what the deck says (fast, deck-sourced)
 *   2. research — web search to verify/augment (search/source/note events)
 *   3. complete — fill the gaps + the scorecard (web-sourced)
 *   4. review   — critique the deck itself (gaps/weaknesses/strengths)
 *   5. verdict  — the custom invest model (stubbed for now)
 *
 * Each field arrives as a live `field` event; the API route and UI only depend
 * on `DueDiligenceForm` + `ProgressEvent`.
 */
class PipelineDiligenceEngine implements DiligenceEngine {
  async run(
    input: DiligenceInput,
    onEvent?: ProgressCallback,
  ): Promise<DueDiligenceForm> {
    const emit: ProgressCallback = onEvent ?? (() => {});
    const form = emptyForm();
    // Extraction + completion are ungrounded generation — use the writer provider.
    const provider = getWriterProvider();

    // 1. Extract everything derivable from the deck.
    emit({ type: "status", phase: "extracting", message: "Reading the deck" });
    await fillFields({
      provider,
      system: buildDeckExtractSystemPrompt(input.playbook, input.deckText),
      user: buildDeckExtractUserPrompt(),
      form,
      emit,
    });

    // 2. Research the web, targeting the fields the deck left empty.
    emit({ type: "status", phase: "researching", message: "Researching online" });
    const researchResult = await research(input, onEvent, {
      companyName: form.company.name.value,
      gaps: computeGaps(form),
    });
    form.sources = researchResult.sources;

    // 3. Complete the form with the findings.
    emit({ type: "status", phase: "completing", message: "Completing the form" });
    await fillFields({
      provider,
      system: buildCompleteSystemPrompt(input.playbook, input.deckText, researchResult),
      user: buildCompleteUserPrompt(),
      form,
      emit,
    });

    // 4. Score the scorecard in its own dedicated pass — the sole input to the
    //    invest model, kept separate so it can't be truncated to empty.
    await scoreCard({
      provider,
      deckText: input.deckText,
      research: researchResult,
      playbook: input.playbook,
      form,
      emit,
    });

    // 5. Critique the deck itself — gaps, weaknesses, and strengths, grounded
    //    in the playbook and research signals gathered above.
    emit({ type: "status", phase: "completing", message: "Reviewing the pitch deck" });
    await reviewDeck({
      provider,
      deckText: input.deckText,
      research: researchResult,
      playbook: input.playbook,
      form,
      emit,
    });

    // 6. Investment verdict from the custom ONNX model.
    emit({ type: "status", phase: "verdict", message: "Running the investment model" });
    const verdict = await predictInvest(form.scorecard);
    form.verdict = verdict;
    emit({ type: "verdict", verdict });

    form.generatedAt = new Date().toISOString();
    emit({ type: "status", phase: "done", message: "Report ready" });
    return form;
  }
}

/** Single entry point used by the API route. */
export function getDiligenceEngine(): DiligenceEngine {
  return new PipelineDiligenceEngine();
}
