import type {
  DiligencePhase,
  DueDiligenceReport,
  ProgressEvent,
  Source,
} from "@/lib/diligence/types";

/** One search query and the sources it surfaced. */
export interface SearchGroup {
  query: string;
  sources: Source[];
}

export type StepStatus = "pending" | "active" | "done";

export interface Step {
  phase: DiligencePhase;
  label: string;
  status: StepStatus;
}

export interface AnalysisState {
  /** "uploading" before the first server event; then the backend phase. */
  phase: DiligencePhase | "uploading";
  steps: Step[];
  searches: SearchGroup[];
  sourceCount: number;
  notes: string;
  startedAt: number | null;
  report: DueDiligenceReport | null;
  error: string | null;
}

const STEP_ORDER: { phase: DiligencePhase; label: string }[] = [
  { phase: "reading", label: "Reading deck" },
  { phase: "researching", label: "Researching" },
  { phase: "synthesizing", label: "Writing report" },
  { phase: "done", label: "Done" },
];

export function initialState(): AnalysisState {
  return {
    phase: "uploading",
    steps: STEP_ORDER.map((s, i) => ({
      ...s,
      status: i === 0 ? "active" : "pending",
    })),
    searches: [],
    sourceCount: 0,
    notes: "",
    startedAt: Date.now(),
    report: null,
    error: null,
  };
}

/** Mark every step before `phase` done, `phase` active, the rest pending. */
function advanceSteps(steps: Step[], phase: DiligencePhase): Step[] {
  const target = STEP_ORDER.findIndex((s) => s.phase === phase);
  return steps.map((step, i) => {
    if (phase === "done") return { ...step, status: "done" };
    if (i < target) return { ...step, status: "done" };
    if (i === target) return { ...step, status: "active" };
    return { ...step, status: "pending" };
  });
}

export type StreamAction = { type: "reset" } | { type: "event"; event: ProgressEvent };

export function streamReducer(state: AnalysisState, action: StreamAction): AnalysisState {
  if (action.type === "reset") return initialState();

  const event = action.event;
  switch (event.type) {
    case "status":
      return {
        ...state,
        phase: event.phase,
        steps: advanceSteps(state.steps, event.phase),
      };
    case "search":
      return {
        ...state,
        searches: [...state.searches, { query: event.query, sources: [] }],
      };
    case "source": {
      const source: Source = { title: event.title, url: event.url };
      const searches = [...state.searches];
      if (searches.length === 0) {
        // A source arrived before any query — bucket it under a generic group.
        searches.push({ query: "Background research", sources: [source] });
      } else {
        const last = searches[searches.length - 1];
        searches[searches.length - 1] = { ...last, sources: [...last.sources, source] };
      }
      return { ...state, searches, sourceCount: state.sourceCount + 1 };
    }
    case "note":
      return { ...state, notes: state.notes + event.text };
    case "report":
      return {
        ...state,
        report: event.report,
        phase: "done",
        steps: advanceSteps(state.steps, "done"),
      };
    case "error":
      return { ...state, error: event.message };
    default:
      return state;
  }
}

/** Total sources across all search groups (deduped already on the backend). */
export function totalSources(state: AnalysisState): number {
  return state.sourceCount;
}
