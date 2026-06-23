import { research } from "@/lib/diligence/research";
import { writeReport } from "@/lib/diligence/writer";
import type {
  DiligenceEngine,
  DiligenceInput,
  DueDiligenceReport,
  ProgressCallback,
} from "@/lib/diligence/types";

/**
 * The diligence pipeline: research (web) → write (structured report). Both
 * stages are generic — they dispatch to whichever provider is configured via
 * the LlmProvider boundary. The API route and UI only see this DiligenceEngine.
 */
class PipelineDiligenceEngine implements DiligenceEngine {
  async run(
    input: DiligenceInput,
    onEvent?: ProgressCallback,
  ): Promise<DueDiligenceReport> {
    const emit: ProgressCallback = onEvent ?? (() => {});

    // Stage 1 — research (emits its own reading/researching/search/source events).
    const researchResult = await research(input, onEvent);

    // Stage 2 — write the structured report from the deck + findings.
    emit({ type: "status", phase: "synthesizing", message: "Writing the due diligence report" });
    const report = await writeReport({ ...input, research: researchResult });

    // The research stage's sources are the authoritative consulted-URL list.
    const sources = researchResult.sources.length
      ? researchResult.sources
      : report.sources;

    emit({ type: "status", phase: "done", message: "Report ready" });
    return { ...report, sources };
  }
}

/** Single entry point used by the API route. */
export function getDiligenceEngine(): DiligenceEngine {
  return new PipelineDiligenceEngine();
}
