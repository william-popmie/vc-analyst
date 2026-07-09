import type { ReactNode } from "react";
import VerdictPopup from "@/components/features/form/VerdictPopup";
import DeckFeedbackPanel from "@/components/features/form/DeckFeedbackPanel";
import ScorecardPanel from "@/components/features/form/ScorecardPanel";
import ResearchTrail from "@/components/features/analyze/ResearchLog";
import type { AnalysisState } from "./streamState";

/**
 * The left-rail card registry — the single place that decides what appears
 * in the rail and in what order. Adding a new card (e.g. a future checklist)
 * is one entry here plus its own component; nothing else needs to change.
 */
export interface RailCard {
  id: string;
  /** Gate a card until it has real data to show. */
  available: (state: AnalysisState) => boolean;
  render: (state: AnalysisState, active: boolean) => ReactNode;
}

export const RAIL_CARDS: RailCard[] = [
  {
    id: "verdict",
    available: (s) => !!s.verdict,
    render: (s) => <VerdictPopup verdict={s.verdict!} />,
  },
  {
    id: "feedback",
    available: (s) => s.deckFeedback.length > 0,
    render: (s, active) => <DeckFeedbackPanel items={s.deckFeedback} active={active} />,
  },
  {
    id: "scorecard",
    available: () => true,
    render: (s, active) => <ScorecardPanel form={s.form} active={active} />,
  },
  {
    id: "research",
    available: (s) => s.searches.length > 0,
    render: (s, active) => <ResearchTrail state={s} active={active} />,
  },
];
