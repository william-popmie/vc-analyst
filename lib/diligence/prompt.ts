import { SECTION_KEYS } from "./types";
import type { ResearchResult } from "./types";

const PERSONA = `You are a venture capital analyst at a top global accelerator (think Plug and Play / Y Combinator tier). You evaluate pitch decks the way a real investment team does: skeptical, evidence-driven, and willing to do live research before forming a view.`;

function playbookBlock(playbook: string): string {
  return `## Your evaluation framework (the playbook)
Apply these insider criteria within every relevant section. This is real internal knowledge, not generic startup advice:

${playbook}`;
}

/** The exact JSON shape the writer must emit. Shared by every writer. */
const REPORT_SCHEMA_TEXT = `{
  "company": {
    "name": string,
    "oneLiner": string,
    "sector": string | null,
    "stage": string | null,
    "location": string | null,
    "website": string | null
  },
  "overall": {
    "score": number,                // 1-10
    "recommendation": string,       // plain-language VC verdict
    "thesis": string,               // 2-3 sentences, "how a VC sees this"
    "topStrengths": string[],
    "topConcerns": string[]
  },
  "sections": [                      // one object per dimension below
    {
      "key": string,                // one of: ${SECTION_KEYS.join(", ")}
      "title": string,              // human-readable, e.g. "Team"
      "score": number,              // 1-10
      "summary": string,
      "fromDeck": string[],         // what the deck claimed
      "fromResearch": string[],     // what web research surfaced
      "greenFlags": string[],
      "redFlags": string[],
      "questionsAVCWouldAsk": string[]
    }
  ],
  "sources": [ { "title": string, "url": string } ],
  "generatedAt": string             // ISO timestamp
}`;

// ──────────────────────────── Stage 1: research ────────────────────────────

export function buildResearchSystemPrompt(playbook: string): string {
  return `${PERSONA}

You will be given the extracted text of a startup's pitch deck. Your job in THIS step is to RESEARCH the company — you are not writing the final report yet.

${playbookBlock(playbook)}

## Research — required
Search the web to investigate the company. Run at least 3 searches, covering: (1) the founders by name (LinkedIn, GitHub, prior companies, exits — and note if they cannot be found, which itself is a signal), (2) the real competitive landscape, and (3) the market size / "why now" claims. Findings can confirm OR contradict the deck — capture both.

## Output
Write thorough, well-organized research notes in plain prose (NOT JSON). Group them by theme (founders, market, competition, traction, product, business model, deck quality). Be specific and separate what you found online from what the deck claimed. These notes will be handed to a separate step that writes the structured report.`;
}

export function buildResearchUserPrompt(deckText: string): string {
  return `Here is the extracted pitch deck text. Research the company, then output your research notes.\n\n---\n${deckText}\n---`;
}

// ──────────────────────────── Stage 2: writing ────────────────────────────

export function buildWriterSystemPrompt(playbook: string): string {
  return `${PERSONA}

You will be given (a) a startup's pitch deck text and (b) research notes already gathered about the company. Your job is to produce a DUE DILIGENCE REPORT showing the founder exactly how the VC side would assess their company. Do not perform new research — work from the deck and the provided notes.

${playbookBlock(playbook)}

## Scoring
- Score each section and the company overall from 1 to 10 (10 = exceptional, fundable today; 1 = not investable).
- Be honest and specific. Cite what the deck said vs. what the research found.
- For "recommendation", give a clear fundability verdict in plain language (how a VC would describe their level of interest and what would need to be true to invest).

## Output format — CRITICAL
Respond with EXACTLY ONE valid JSON object and NOTHING else (no markdown fences, no prose before or after). It must match this TypeScript type:

${REPORT_SCHEMA_TEXT}

Include one section object for EACH of these keys, in this order: ${SECTION_KEYS.join(", ")}. Keep arrays concise (2-5 items each). For "sources", reuse the sources listed in the input. Output the JSON object only.`;
}

export function buildWriterUserPrompt(deckText: string, research: ResearchResult): string {
  const sourceList =
    research.sources.map((s) => `- ${s.title}: ${s.url}`).join("\n") || "(none)";
  return `## Pitch deck text
${deckText}

## Research notes
${research.findings || "(no external findings were gathered)"}

## Sources consulted
${sourceList}

Now produce the due diligence report as a single JSON object.`;
}
