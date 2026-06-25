import type { DueDiligenceForm, FieldSource, Founder } from "./types";

/**
 * Parsing + assembly for the NDJSON field stream the model emits. Each line is
 * one field: {"key": "...", "value": ..., "source": "..."}. `parseFieldLine`
 * turns a line into a typed field; `applyField` writes it onto the form.
 */

export interface ParsedField {
  key: string;
  value: unknown;
  source: FieldSource;
}

const VALID_SOURCES = new Set<FieldSource>(["deck", "web", "inferred", "unknown"]);

/** Parse one NDJSON line into a field, tolerating fences/whitespace. */
export function parseFieldLine(line: string): ParsedField | null {
  const trimmed = line.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;
  try {
    const obj = JSON.parse(trimmed) as { key?: unknown; value?: unknown; source?: unknown };
    if (typeof obj.key !== "string") return null;
    const source = (typeof obj.source === "string" && VALID_SOURCES.has(obj.source as FieldSource)
      ? obj.source
      : "inferred") as FieldSource;
    return { key: obj.key, value: obj.value, source };
  } catch {
    return null;
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function clampRating(v: unknown): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 0;
}

function normalizeFounders(value: unknown): Founder[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((f) => {
      const o = (f ?? {}) as Record<string, unknown>;
      return {
        role: str(o.role),
        name: str(o.name),
        commitment: str(o.commitment),
        background: Array.isArray(o.background) ? o.background.map(str).filter(Boolean) : [],
      };
    })
    .filter((f) => f.name || f.role);
}

/**
 * Apply a parsed field onto the form (mutates). Returns true if the key was
 * recognized and written — unknown keys are ignored defensively.
 */
export function applyField(
  form: DueDiligenceForm,
  key: string,
  value: unknown,
  source: FieldSource,
): boolean {
  if (key === "founders") {
    form.founders.members = normalizeFounders(value);
    return true;
  }

  if (key.startsWith("scorecard.")) {
    const metric = key.slice("scorecard.".length);
    if (metric === "funding") {
      const n = Math.round(Number(value));
      form.scorecard.funding = Number.isFinite(n) ? Math.max(0, n) : 0;
      return true;
    }
    if (metric in form.scorecard) {
      (form.scorecard as unknown as Record<string, number>)[metric] = clampRating(value);
      return true;
    }
    return false;
  }

  // Dotted "section.field" → a Field { value, source }.
  const [section, field] = key.split(".");
  const node = (form as unknown as Record<string, Record<string, unknown>>)[section];
  if (node && field && field in node) {
    const target = node[field];
    if (target && typeof target === "object" && "value" in target) {
      node[field] = { value: str(value), source };
      return true;
    }
  }
  return false;
}
