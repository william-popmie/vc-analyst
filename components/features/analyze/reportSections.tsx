import type { ReactNode } from "react";
import VerdictPopup from "@/components/features/form/VerdictPopup";
import DeckFeedbackPanel from "@/components/features/form/DeckFeedbackPanel";
import ScorecardPanel from "@/components/features/form/ScorecardPanel";
import ResearchTrail from "@/components/features/analyze/ResearchLog";
import DueDiligenceFormView from "@/components/features/form/DueDiligenceFormView";
import type { AnalysisState } from "./streamState";

/**
 * The report section registry — the single place that decides what sections the
 * report has, their order, and their labels. It drives both the stacked content
 * column and the chapters nav. Adding a section (e.g. a future checklist) is one
 * entry here plus its component; nothing else needs to change.
 */
export interface ReportSection {
  /** Anchor id used for scroll-spy + jump links. */
  id: string;
  /** Label shown in the chapters nav. */
  label: string;
  /** Gate a section until it has real data to show. */
  available: (state: AnalysisState) => boolean;
  render: (state: AnalysisState, active: boolean) => ReactNode;
}

export const REPORT_SECTIONS: ReportSection[] = [
  {
    id: "verdict",
    label: "Verdict",
    available: (s) => !!s.verdict,
    render: (s) => <VerdictPopup verdict={s.verdict!} />,
  },
  {
    id: "feedback",
    label: "Deck feedback",
    available: (s) => s.deckFeedback.length > 0,
    render: (s, active) => <DeckFeedbackPanel items={s.deckFeedback} active={active} />,
  },
  {
    id: "scorecard",
    label: "Scorecard",
    available: () => true,
    render: (s, active) => <ScorecardPanel form={s.form} active={active} />,
  },
  {
    id: "research",
    label: "Research",
    available: (s) => s.searches.length > 0,
    render: (s, active) => <ResearchTrail state={s} active={active} />,
  },
  {
    id: "document",
    label: "Document",
    available: () => true,
    render: (s, active) => <DueDiligenceFormView form={s.form} active={active} />,
  },
];
