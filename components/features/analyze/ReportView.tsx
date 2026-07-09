"use client";

import DueDiligenceFormView from "@/components/features/form/DueDiligenceFormView";
import { RAIL_CARDS } from "./railCards";
import type { AnalysisState } from "./streamState";

/**
 * The two-column results layout: a left rail of "what the model produced
 * about the deck" cards (verdict, feedback, scorecard, research — driven by
 * the RAIL_CARDS registry) beside the due-diligence document, which owns the
 * wider right column as the actual deliverable. Used for both the live
 * streaming run and the finished report — `active` toggles skeleton states.
 */
export default function ReportView({ state, active }: { state: AnalysisState; active: boolean }) {
  const cards = RAIL_CARDS.filter((c) => c.available(state));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        {cards.map((c) => (
          <div key={c.id}>{c.render(state, active)}</div>
        ))}
      </div>
      <DueDiligenceFormView form={state.form} active={active} />
    </div>
  );
}
