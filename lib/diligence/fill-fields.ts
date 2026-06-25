import { getProvider } from "@/lib/llm";
import type { Provider } from "@/lib/llm";
import { applyField, parseFieldLine } from "./parse";
import type { DueDiligenceForm, ProgressCallback } from "./types";

interface FillArgs {
  provider: Provider;
  system: string;
  user: string;
  /** The form to mutate as fields arrive. */
  form: DueDiligenceForm;
  emit: ProgressCallback;
}

/**
 * Generic field-fill stage. Streams an NDJSON field response from the provider,
 * parses each line as it completes, applies it onto the form, and emits a live
 * `field` event — so the UI fills cells in real time. Used by both the
 * deck-extract pass and the completion pass.
 */
export async function fillFields({ provider, system, user, form, emit }: FillArgs): Promise<void> {
  let buffer = "";

  const handleLine = (line: string) => {
    const parsed = parseFieldLine(line);
    if (!parsed) return;
    if (applyField(form, parsed.key, parsed.value, parsed.source)) {
      emit({ type: "field", key: parsed.key, value: parsed.value, source: parsed.source });
    }
  };

  await getProvider(provider).generateStream({
    system,
    user,
    onText: (delta) => {
      buffer += delta;
      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (line.trim()) handleLine(line);
      }
    },
  });

  // Flush any trailing line without a terminating newline.
  if (buffer.trim()) handleLine(buffer);
}
