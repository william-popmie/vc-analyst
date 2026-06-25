import { emptyForm } from "@/lib/diligence/form-schema";
import { applyField } from "@/lib/diligence/parse";
import type {
  DiligencePhase,
  DueDiligenceForm,
  InvestVerdict,
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
  phase: DiligencePhase | "uploading";
  steps: Step[];
  /** The form, mutated live as `field` events arrive. */
  form: DueDiligenceForm;
  /** Keys filled so far (drives cell highlight / count). */
  filledCount: number;
  /** Most recently filled key (for a brief highlight). */
  lastKey: string | null;
  searches: SearchGroup[];
  sourceCount: number;
  notes: string;
  verdict: InvestVerdict | null;
  startedAt: number | null;
  error: string | null;
}

const STEP_ORDER: { phase: DiligencePhase; label: string }[] = [
  { phase: "extracting", label: "Reading deck" },
  { phase: "researching", label: "Researching" },
  { phase: "completing", label: "Completing form" },
  { phase: "verdict", label: "Verdict" },
  { phase: "done", label: "Done" },
];

export function initialState(): AnalysisState {
  return {
    phase: "uploading",
    steps: STEP_ORDER.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" })),
    form: emptyForm(),
    filledCount: 0,
    lastKey: null,
    searches: [],
    sourceCount: 0,
    notes: "",
    verdict: null,
    startedAt: Date.now(),
    error: null,
  };
}

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
      return { ...state, phase: event.phase, steps: advanceSteps(state.steps, event.phase) };

    case "field": {
      // Mutate a cloned form so React sees a new reference.
      const form = structuredClone(state.form);
      applyField(form, event.key, event.value, event.source);
      return { ...state, form, filledCount: state.filledCount + 1, lastKey: event.key };
    }

    case "search":
      return { ...state, searches: [...state.searches, { query: event.query, sources: [] }] };

    case "source": {
      const source: Source = { title: event.title, url: event.url };
      const searches = [...state.searches];
      if (searches.length === 0) {
        searches.push({ query: "Background research", sources: [source] });
      } else {
        const last = searches[searches.length - 1];
        searches[searches.length - 1] = { ...last, sources: [...last.sources, source] };
      }
      return { ...state, searches, sourceCount: state.sourceCount + 1 };
    }

    case "note":
      return { ...state, notes: state.notes + event.text };

    case "verdict":
      return { ...state, verdict: event.verdict };

    case "report":
      return {
        ...state,
        form: event.report,
        verdict: event.report.verdict ?? state.verdict,
        phase: "done",
        steps: advanceSteps(state.steps, "done"),
      };

    case "error":
      return { ...state, error: event.message };

    default:
      return state;
  }
}
