import Anthropic from "@anthropic-ai/sdk";
import { MODEL_ID, getAnthropicApiKey } from "@/lib/config";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/diligence/prompt";
import { normalize, parseReport } from "@/lib/diligence/parse";
import type {
  DiligenceEngine,
  DiligenceInput,
  DueDiligenceReport,
  ProgressCallback,
} from "@/lib/diligence/types";

const MAX_CONTINUATIONS = 4; // safety cap for the server-side web-search loop
const MAX_SEARCHES = 4; // bound research breadth to keep latency reasonable

// Shared request params. effort "low" keeps Opus fast for this research-heavy
// task (it still performs very well) and bounds web_search uses for latency.
const webSearchTool = {
  type: "web_search_20260209" as const,
  name: "web_search" as const,
  max_uses: MAX_SEARCHES,
};

/**
 * Claude implementation of the diligence engine: reads the deck, researches via
 * the native web_search tool, and returns a structured DueDiligenceReport.
 */
export class ClaudeDiligenceEngine implements DiligenceEngine {
  async run(
    { deckText, playbook }: DiligenceInput,
    onEvent?: ProgressCallback,
  ): Promise<DueDiligenceReport> {
    const emit: ProgressCallback = onEvent ?? (() => {});
    const client = new Anthropic({ apiKey: getAnthropicApiKey() });

    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: buildUserPrompt(deckText) },
    ];

    const system = buildSystemPrompt(playbook);
    const params = {
      model: MODEL_ID,
      max_tokens: 16000,
      system,
      tools: [webSearchTool],
      output_config: { effort: "medium" as const },
    };

    emit({ type: "status", phase: "reading", message: "Reading the deck" });

    // De-dupe sources across the whole run so we don't report the same URL twice.
    const seenSources = new Set<string>();
    let researching = false;

    // Wire up per-block progress. server_tool_use blocks carry the search query;
    // web_search_tool_result blocks carry the pages Claude consulted.
    type Stream = ReturnType<typeof client.messages.stream>;
    const attachProgress = (stream: Stream) => {
      stream.on("contentBlock", (block: Anthropic.ContentBlock) => {
        if (block.type === "server_tool_use" && block.name === "web_search") {
          if (!researching) {
            researching = true;
            emit({ type: "status", phase: "researching", message: "Researching online" });
          }
          const query = (block.input as { query?: string } | null)?.query;
          if (query) emit({ type: "search", query });
        } else if (block.type === "web_search_tool_result") {
          const results = Array.isArray(block.content) ? block.content : [];
          for (const r of results) {
            if (r.type !== "web_search_result" || !r.url || seenSources.has(r.url)) continue;
            seenSources.add(r.url);
            emit({ type: "source", title: r.title ?? r.url, url: r.url });
          }
        }
      });
    };

    let stream = client.messages.stream({ ...params, messages });
    attachProgress(stream);
    let response = await stream.finalMessage();

    // The web_search tool runs a server-side loop; it may pause with
    // stop_reason "pause_turn". Re-send to let it resume until it finishes.
    let continuations = 0;
    while (response.stop_reason === "pause_turn" && continuations < MAX_CONTINUATIONS) {
      messages.push({ role: "assistant", content: response.content });
      stream = client.messages.stream({ ...params, messages });
      attachProgress(stream);
      response = await stream.finalMessage();
      continuations += 1;
    }

    emit({ type: "status", phase: "synthesizing", message: "Writing the due diligence report" });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const report = normalize(parseReport(text));
    emit({ type: "status", phase: "done", message: "Report ready" });
    return report;
  }
}
