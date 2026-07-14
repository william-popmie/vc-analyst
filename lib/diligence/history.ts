import type { AnalysisState } from "@/components/features/analyze/streamState";

const STORAGE_KEY = "vc-analyst:history";
const MAX_RECORDS = 10;

/** A finished analysis, saved so it can be reopened without re-running. */
export interface AnalysisRecord {
  /** SHA-256 of the uploaded PDF bytes — dedupes re-runs of the same deck. */
  id: string;
  name: string;
  generatedAt: string;
  state: AnalysisState;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// A same-tab notification channel: the native `storage` event only fires in
// *other* tabs, so writers here also notify in-process subscribers directly
// (used by useSyncExternalStore to re-render on save/clear in the same tab).
type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((l) => l());
}

export function subscribeHistory(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Cross-tab writes fire the native `storage` event — forward it to our
// listeners too, once per module load.
if (isBrowser()) {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) notify();
  });
}

/** Hex SHA-256 of a file's bytes, used as the dedupe key for a deck. */
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const EMPTY: AnalysisRecord[] = [];
let cachedRaw: string | null = null;
let cachedRecords: AnalysisRecord[] = EMPTY;

/**
 * Reads and parses the stored history. Returns the same array reference when
 * the underlying storage hasn't changed since the last read — required so
 * `useSyncExternalStore` (AnalysisProvider) doesn't re-render in a loop.
 */
export function loadHistory(): AnalysisRecord[] {
  if (!isBrowser()) return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedRecords;
    cachedRaw = raw;
    const parsed = raw ? JSON.parse(raw) : EMPTY;
    cachedRecords = Array.isArray(parsed) ? parsed : EMPTY;
    return cachedRecords;
  } catch {
    cachedRecords = EMPTY;
    return cachedRecords;
  }
}

export function getRecord(id: string): AnalysisRecord | null {
  return loadHistory().find((r) => r.id === id) ?? null;
}

/** Saves a finished analysis, replacing any prior record for the same deck. */
export function saveRecord(record: AnalysisRecord): void {
  if (!isBrowser()) return;
  try {
    const rest = loadHistory().filter((r) => r.id !== record.id);
    const next = [record, ...rest].slice(0, MAX_RECORDS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    notify();
  } catch {
    // Storage unavailable or full — persistence is best-effort.
  }
}

/** Removes a single record by id, freeing its localStorage slot. */
export function deleteRecord(id: string): void {
  if (!isBrowser()) return;
  try {
    const next = loadHistory().filter((r) => r.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    notify();
  } catch {
    // ignore
  }
}

export function clearHistory(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    notify();
  } catch {
    // ignore
  }
}
