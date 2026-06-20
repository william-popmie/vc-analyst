/**
 * The single contract between backend and frontend.
 *
 * The backend's only job is to produce a `DueDiligenceReport`; the frontend's
 * only job is to render its fields. Nothing else couples the two sides — change
 * what's shown by editing this one file and both sides follow.
 */

export type Score = number; // 1–10

export const SECTION_KEYS = [
  "team",
  "market",
  "product",
  "competition",
  "businessModel",
  "traction",
  "deckQuality",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export interface DiligenceSection {
  key: SectionKey;
  title: string;
  score: Score;
  /** The VC's narrative take on this dimension. */
  summary: string;
  /** What the deck itself claimed. */
  fromDeck: string[];
  /** What live web research surfaced (may confirm or contradict the deck). */
  fromResearch: string[];
  greenFlags: string[];
  redFlags: string[];
  /** Diligence questions a VC would raise in a real meeting. */
  questionsAVCWouldAsk: string[];
}

export interface Source {
  title: string;
  url: string;
}

export interface DueDiligenceReport {
  company: {
    name: string;
    oneLiner: string;
    sector: string | null;
    stage: string | null; // e.g. pre-seed, seed
    location: string | null;
    website: string | null;
  };
  overall: {
    score: Score;
    /** The VC verdict — fundability signal. */
    recommendation: string;
    /** 2–3 sentence "how a VC sees this". */
    thesis: string;
    topStrengths: string[];
    topConcerns: string[];
  };
  sections: DiligenceSection[];
  /** Web-search citations backing the research. */
  sources: Source[];
  generatedAt: string;
}

/** Input the engine needs to produce a report. */
export interface DiligenceInput {
  deckText: string;
  playbook: string;
}

/**
 * Progress events the engine emits while it works, so the UI can show live
 * activity instead of a frozen spinner. These are streamed to the client as
 * NDJSON; the frontend imports only these types to render the research log.
 */
export type ProgressEvent =
  /** A coarse phase change in the pipeline. */
  | { type: "status"; phase: DiligencePhase; message: string }
  /** Claude fired a web search with this query. */
  | { type: "search"; query: string }
  /** A source Claude consulted while researching. */
  | { type: "source"; title: string; url: string }
  /** Terminal success event — carries the finished report. */
  | { type: "report"; report: DueDiligenceReport }
  /** Terminal failure event. */
  | { type: "error"; message: string };

export type DiligencePhase =
  | "reading"
  | "researching"
  | "synthesizing"
  | "done";

/** Callback the engine calls to report progress as it runs. */
export type ProgressCallback = (event: ProgressEvent) => void;

/**
 * The swappable research engine. The Claude implementation can be replaced with
 * a custom research engine later without touching the API route or the UI.
 *
 * `onEvent` is optional: callers that just want the final report can ignore it,
 * while the streaming API route passes one to forward progress to the client.
 */
export interface DiligenceEngine {
  run(input: DiligenceInput, onEvent?: ProgressCallback): Promise<DueDiligenceReport>;
}

/** Thrown when a deck has too little extractable text (e.g. image-only PDF). */
export class EmptyDeckError extends Error {
  constructor(message = "Could not read text from this PDF. It may be image-only or scanned.") {
    super(message);
    this.name = "EmptyDeckError";
  }
}
