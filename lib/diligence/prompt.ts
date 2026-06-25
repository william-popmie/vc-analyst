import { FIELD_DESCRIPTORS } from "./form-schema";
import type { ResearchResult } from "./types";

const PERSONA = `You are a venture capital analyst at a top global accelerator (think Plug and Play / Y Combinator tier). You evaluate startups the way a real investment team does: skeptical, evidence-driven, and precise.`;

function playbookBlock(playbook: string): string {
  return `## Your evaluation framework (the playbook)
Apply these insider criteria. This is real internal knowledge, not generic startup advice:

${playbook}`;
}

/**
 * Render the field registry as a guide the model fills in. The scorecard
 * (rating/number kinds) is scored in its own dedicated stage, so the NDJSON
 * field passes skip it.
 */
function fieldGuide(): string {
  return FIELD_DESCRIPTORS.filter((f) => f.kind !== "rating" && f.kind !== "number")
    .map((f) => {
      let type = "text (string)";
      if (f.kind === "founders") type = "array of objects {role, name, commitment, background (array of strings)}";
      return `- ${f.key} — ${type} — ${f.hint}`;
    })
    .join("\n");
}

/** The NDJSON contract shared by the deck-extract and completion passes. */
const NDJSON_RULES = `## Output format — STRICT
Output ONLY a sequence of JSON objects, ONE PER LINE (NDJSON). No prose, no markdown fences, no surrounding array — just one JSON object per line. Each line must be:
{"key": "<field key>", "value": <value>, "source": "<deck|web|inferred|unknown>"}
Rules:
- Emit the fields in the order listed below.
- For text fields "value" is a string; for "founders" it is the JSON array.
- "source": "deck" if it came from the pitch deck, "web" if from research, "inferred" if you reasoned it, "unknown" if you genuinely don't have it.
- Do NOT fabricate. If a field can't be filled, skip it (don't emit a line).
- Keep text values concise and specific (1–4 sentences). Output nothing except the JSON lines.

## Fields
${fieldGuide()}`;

// ───────────────────────── Pass 1: extract from the deck ─────────────────────────

export function buildDeckExtractSystemPrompt(playbook: string): string {
  return `${PERSONA}

You will be given the extracted text of a startup's pitch deck. Fill in every field of the due-diligence form that you can find IN THE DECK. Use source "deck" for everything here. Skip fields the deck doesn't cover (especially "company.source" and "company.personalNote", which come from the investor's own meeting and are almost never in a deck). Do NOT score the scorecard yet — skip all scorecard.* fields in this pass.

${playbookBlock(playbook)}

${NDJSON_RULES}`;
}

export function buildDeckExtractUserPrompt(deckText: string): string {
  return `Pitch deck text:\n\n---\n${deckText}\n---\n\nEmit the deck-derived fields as NDJSON now.`;
}

// ───────────────────────── Pass 2: web research ─────────────────────────

export function buildResearchSystemPrompt(playbook: string): string {
  return `${PERSONA}

You will be given a startup's pitch deck plus a list of FACTS STILL MISSING after reading the deck. Research the company on the web to support a due-diligence form.

Your #1 job is to find the missing facts in that list — most are one or two web searches away (a founding year, an HQ city, the founders' names and prior roles). Run a separate, specific search for each missing fact; don't give up after one generic query. Also verify the founders (LinkedIn/prior companies/exits — note if they genuinely can't be found, which is itself a signal), map the real competitive landscape, validate the market size and "why now", and find traction/funding signals. Findings can confirm OR contradict the deck — capture both.

${playbookBlock(playbook)}

## Output
Write thorough research notes in plain prose (NOT JSON), grouped by theme (founders, founded/location, problem, solution, market, competition, traction, funding). For EACH missing fact you were asked to find, state it explicitly and plainly (e.g. "Founded: 2008", "Based in: San Francisco, CA", "Co-founder: Brian Chesky — RISD, ex-...") so the next step can't miss it. If after searching you truly can't find one, say so explicitly.`;
}

export function buildResearchUserPrompt(
  deckText: string,
  companyName: string,
  gaps: string[],
): string {
  const company = companyName || "(unknown — identify it from the deck)";
  const gapBlock = gaps.length
    ? `## Facts still MISSING after the deck (find these first)\n${gaps.map((g) => `- ${g}`).join("\n")}`
    : `## The deck covered the basics — verify and enrich them.`;
  return `Company: ${company}

${gapBlock}

## Pitch deck text
---
${deckText}
---

Research the company on the web — prioritizing the missing facts above — then output your notes.`;
}

// ───────────────────────── Pass 3: complete the form ─────────────────────────

export function buildCompleteSystemPrompt(playbook: string): string {
  return `${PERSONA}

You are given (a) a startup's pitch deck and (b) research notes already gathered. Produce the COMPLETE due-diligence form: fill every field you can, preferring the most accurate value (use the deck for claims, the research to verify/augment/correct).

CRITICAL: any field the deck didn't cover MUST be filled from the research notes whenever the notes contain it — especially company.founded, company.basedIn, and founders (names, roles, backgrounds). For those web-derived values use source "web". Only leave a field unfilled if neither the deck nor the research has it.

${playbookBlock(playbook)}

${NDJSON_RULES}`;
}

export function buildCompleteUserPrompt(deckText: string, research: ResearchResult): string {
  const sourceList =
    research.sources.map((s) => `- ${s.title}: ${s.url}`).join("\n") || "(none)";
  return `## Pitch deck text
${deckText}

## Research notes
${research.findings || "(no external findings were gathered)"}

## Sources consulted
${sourceList}

Now emit the complete form as NDJSON.`;
}

// ───────────────────────── Pass 4: score the scorecard ─────────────────────────

/**
 * The scorecard is the SOLE input to the trained invest model, so it gets its
 * own dedicated stage: a single small JSON object, impossible to truncate, that
 * always produces all seven values. Definitions match William's rubric exactly.
 */
export function buildScorecardSystemPrompt(playbook: string): string {
  return `${PERSONA}

Score this startup on William's seven-factor scorecard. This is a judgment call — you always have enough to give your best estimate, so NEVER leave a value out. Use the deck and the research notes together.

Rate each of these 1–5 (1 = weak, 5 = exceptional):
- team — strength, completeness and track record of the founding team.
- technology — product/tech maturity. 1 = prototype / MVP / undeveloped, 5 = market-ready (shipping, productized).
- marketSize — size and growth of the addressable market.
- valueProposition — how compelling and differentiated the value to customers is.
- competitiveAdvantage — moat / defensibility versus competitors.
- socialImpact — positive social or environmental impact.

And one number:
- funding — the total amount of money the startup has ALREADY RAISED to date (sum of prior rounds / capital in), as a plain integer in the deck's currency (no symbols, no separators). This is NOT the amount they are currently asking for. If nothing has been raised yet, or it's genuinely unknown, use 0.

${playbookBlock(playbook)}

## Output format — STRICT
Output ONLY one JSON object, nothing else (no prose, no markdown fences):
{"team": <1-5>, "technology": <1-5>, "marketSize": <1-5>, "valueProposition": <1-5>, "competitiveAdvantage": <1-5>, "socialImpact": <1-5>, "funding": <integer>}`;
}

export function buildScorecardUserPrompt(deckText: string, research: ResearchResult): string {
  return `## Pitch deck text
${deckText}

## Research notes
${research.findings || "(no external findings were gathered)"}

Now output the scorecard JSON object.`;
}
