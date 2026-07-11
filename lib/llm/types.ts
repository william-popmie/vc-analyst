/**
 * The provider-agnostic LLM boundary. Everything vendor-/SDK-specific lives
 * behind this interface in exactly one file per provider (claude.ts, gemini.ts).
 * The pipeline above is generic and only ever talks to `LlmProvider`.
 */

export type Provider = "gemini" | "claude";

/**
 * One chunk of a system prompt. `cache` marks a breakpoint: everything up to
 * and including this block is a candidate for prompt-cache reuse, so callers
 * should order blocks stable-content-first (persona/playbook/deck) and put
 * volatile, stage-specific instructions last, after any cached block.
 */
export interface SystemBlock {
  text: string;
  cache?: boolean;
}

/** A system prompt is either a plain string or an ordered list of blocks. */
export type SystemPrompt = string | SystemBlock[];

/** A web page consulted during research. */
export interface WebSource {
  title: string;
  url: string;
}

export interface ResearchArgs {
  /** System / instruction prompt. */
  system: SystemPrompt;
  /** User prompt (the deck text + task). */
  user: string;
  /** Called with each search query as it happens. */
  onSearch?: (query: string) => void;
  /** Called with each source as it's consulted. */
  onSource?: (source: WebSource) => void;
  /** Called with each incremental chunk of the model's research notes text. */
  onText?: (delta: string) => void;
}

export interface ResearchOutput {
  /** Prose research notes. */
  findings: string;
  /** Sources consulted (authoritative URL list). */
  sources: WebSource[];
}

export interface GenerateArgs {
  system: SystemPrompt;
  user: string;
  /** Called with each incremental chunk of the generated text. */
  onText?: (delta: string) => void;
}

/**
 * One adapter per LLM vendor. Each method is a generic capability; the
 * implementation translates it into that vendor's SDK calls (model choice,
 * tool/grounding shape, streaming, etc.).
 */
export interface LlmProvider {
  readonly name: Provider;

  /** OCR: transcribe an image-only / scanned PDF to plain text. */
  transcribePdf(pdf: Buffer, instruction: string): Promise<string>;

  /** Research the web; stream queries/sources; return findings + sources. */
  researchWeb(args: ResearchArgs): Promise<ResearchOutput>;

  /**
   * Generate text (ungrounded, no tools), streaming chunks via `onText`, and
   * return the full text. Used to stream the NDJSON form-field fill.
   */
  generateStream(args: GenerateArgs): Promise<string>;
}
