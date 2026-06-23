import type { Provider } from "@/lib/llm";

/**
 * Per-stage provider selection. Each pipeline stage (OCR, research, writing)
 * picks its provider independently — no vendor lock. Precedence:
 *
 *   STAGE_PROVIDER env  →  LLM_PROVIDER env (global)  →  per-stage default
 *
 * So `LLM_PROVIDER=gemini` flips every stage to Gemini in one line, while
 * leaving it unset keeps the quality-split defaults below.
 */
function pick(stageEnv: string | undefined, fallback: Provider): Provider {
  const raw = (stageEnv ?? process.env.LLM_PROVIDER ?? fallback).toLowerCase();
  return raw === "claude" ? "claude" : raw === "gemini" ? "gemini" : fallback;
}

/** OCR of image-only / scanned decks. Default Gemini (cheap, fast, native PDF). */
export const getOcrProvider = (): Provider => pick(process.env.OCR_PROVIDER, "gemini");

/** Web research. Default Claude (clean source URLs + live per-query streaming). */
export const getResearchProvider = (): Provider =>
  pick(process.env.RESEARCH_PROVIDER, "claude");

/** Report writing / synthesis. Default Claude (sharper judgment, reliable JSON). */
export const getWriterProvider = (): Provider =>
  pick(process.env.WRITER_PROVIDER, "claude");
