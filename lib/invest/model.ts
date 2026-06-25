import type { InvestVerdict, Scorecard } from "@/lib/diligence/types";

/**
 * Custom invest / don't-invest model — trained on William's 800+ reviewed decks.
 * Takes the 6 metrics (1–5) + funding amount and outputs 1 (invest) / 0 (pass).
 *
 * STUB for now: returns `available: false` so the UI shows a placeholder.
 *
 * To wire it up (later):
 *   1. Convert model.joblib → model.onnx and place it at lib/invest/model.onnx.
 *   2. `npm i onnxruntime-node`.
 *   3. Load the session once (module scope), then run with the feature vector
 *      built below — the order MUST match training:
 *      [team, technology, marketSize, valueProposition, competitiveAdvantage,
 *       socialImpact, funding].
 *   4. invest = output === 1; return { invest, available: true }.
 */
export async function predictInvest(scorecard: Scorecard): Promise<InvestVerdict> {
  // Feature vector in the exact training order (ready for the ONNX session).
  const features = [
    scorecard.team,
    scorecard.technology,
    scorecard.marketSize,
    scorecard.valueProposition,
    scorecard.competitiveAdvantage,
    scorecard.socialImpact,
    scorecard.funding,
  ];
  void features; // TODO: feed to model.onnx via onnxruntime-node.

  return {
    invest: false,
    available: false,
    note: "Investment model not yet connected — convert model.joblib → model.onnx to enable.",
  };
}
