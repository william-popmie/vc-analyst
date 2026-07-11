/**
 * A single strategy for turning a PDF buffer into plain deck text.
 *
 * Extractors are the plug-and-play unit of the PDF layer: each one knows how to
 * get text out of *some* kind of deck (a machine-readable text layer, an
 * image-only scan, …). The orchestrator in `extract.ts` runs them in order until
 * one returns enough text, so adding support for a new kind of deck means
 * writing one more `DeckTextExtractor` and registering it — nothing else changes.
 */
import type { TokenUsage } from "@/lib/llm/types";

export interface DeckTextExtractor {
  /** Stable, human-readable name. Used only for logging which strategy ran. */
  readonly name: string;

  /**
   * Attempt to produce plain text from the PDF buffer.
   *
   * Return whatever text was found (the orchestrator decides if it's enough).
   * Return "" when this strategy simply can't handle the PDF — the orchestrator
   * will fall through to the next extractor. Throwing is also tolerated: the
   * orchestrator catches it, logs, and moves on, so one broken strategy never
   * breaks the chain.
   *
   * `onUsage` is only meaningful for LLM-backed strategies (e.g. vision OCR);
   * strategies that don't call an LLM simply ignore it.
   */
  extract(buffer: Buffer, onUsage?: (usage: TokenUsage) => void): Promise<string>;
}
