import Anthropic from "@anthropic-ai/sdk";
import { HAIKU_MODEL_ID, MODEL_ID, OCR_MODEL_ID, getAnthropicApiKey } from "@/lib/config";
import type {
  GenerateArgs,
  LlmProvider,
  ResearchArgs,
  ResearchOutput,
  SystemPrompt,
  TokenUsage,
  WebSource,
} from "./types";

// All Anthropic-specific knobs live here and nowhere else.
const MAX_CONTINUATIONS = 6; // safety cap for the server-side web-search loop
const MAX_SEARCHES = 5; // research breadth — enough to chase each missing fact without runaway cost
const RESEARCH_MAX_TOKENS = 5000;
const WRITE_MAX_TOKENS = 16000;
const OCR_MAX_TOKENS = 16000;

const webSearchTool = {
  type: "web_search_20260209" as const,
  name: "web_search" as const,
  max_uses: MAX_SEARCHES,
};

function client(): Anthropic {
  return new Anthropic({ apiKey: getAnthropicApiKey() });
}

/**
 * Map the generic `SystemPrompt` to Anthropic's system param shape, applying
 * a cache_control breakpoint to blocks marked `cache: true`. The
 * playbook+deck prefix is large and byte-identical across stages/calls, so
 * caching it turns repeat reads (research continuations, later pipeline
 * stages within the 5-min window) into cheap cache hits instead of
 * full-price input tokens.
 */
function toSystem(system: SystemPrompt): string | Anthropic.TextBlockParam[] {
  if (typeof system === "string") return system;
  return system.map((block) => ({
    type: "text" as const,
    text: block.text,
    ...(block.cache ? { cache_control: { type: "ephemeral" as const } } : {}),
  }));
}

/** Join the text blocks of a message into one trimmed string. */
function textOf(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/** Normalize an Anthropic `Usage` object to the provider-agnostic shape. */
function usageOf(usage: Anthropic.Usage, model: string): TokenUsage {
  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheReadTokens: usage.cache_read_input_tokens ?? 0,
    cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
    webSearches: usage.server_tool_use?.web_search_requests,
    model,
    provider: "claude",
  };
}

/** Anthropic Claude adapter — translates the generic capabilities to the SDK. */
export const claudeProvider: LlmProvider = {
  name: "claude",

  async transcribePdf(pdf, instruction, onUsage) {
    // Stream to avoid HTTP timeouts on long transcriptions; we only need text.
    const stream = client().messages.stream({
      model: OCR_MODEL_ID,
      max_tokens: OCR_MAX_TOKENS,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdf.toString("base64"),
              },
            },
            { type: "text", text: instruction },
          ],
        },
      ],
    });
    const message = await stream.finalMessage();
    onUsage?.(usageOf(message.usage, OCR_MODEL_ID));
    return textOf(message.content);
  },

  async researchWeb({ system, user, onSearch, onSource, onText, onUsage, signal }): Promise<ResearchOutput> {
    const c = client();
    const messages: Anthropic.MessageParam[] = [{ role: "user", content: user }];
    const params = {
      model: MODEL_ID,
      max_tokens: RESEARCH_MAX_TOKENS,
      system: toSystem(system),
      tools: [webSearchTool],
      output_config: { effort: "low" as const },
    };

    const sources: WebSource[] = [];
    const seen = new Set<string>();

    // server_tool_use blocks carry the query; web_search_tool_result blocks
    // carry the consulted pages (with clean, direct URLs).
    type Stream = ReturnType<typeof c.messages.stream>;
    const attach = (stream: Stream) => {
      // Surface the model's findings prose live (observational only).
      if (onText) stream.on("text", (delta: string) => onText(delta));
      stream.on("contentBlock", (block: Anthropic.ContentBlock) => {
        if (block.type === "server_tool_use" && block.name === "web_search") {
          const query = (block.input as { query?: string } | null)?.query;
          if (query) onSearch?.(query);
        } else if (block.type === "web_search_tool_result") {
          const results = Array.isArray(block.content) ? block.content : [];
          for (const r of results) {
            if (r.type !== "web_search_result" || !r.url || seen.has(r.url)) continue;
            seen.add(r.url);
            const source: WebSource = { title: r.title ?? r.url, url: r.url };
            sources.push(source);
            onSource?.(source);
          }
        }
      });
    };

    let stream = c.messages.stream({ ...params, messages }, { signal });
    attach(stream);
    let response = await stream.finalMessage();
    onUsage?.(usageOf(response.usage, MODEL_ID));

    // The web_search tool runs a server-side loop; resume on pause_turn.
    let continuations = 0;
    while (response.stop_reason === "pause_turn" && continuations < MAX_CONTINUATIONS) {
      messages.push({ role: "assistant", content: response.content });
      stream = c.messages.stream({ ...params, messages }, { signal });
      attach(stream);
      response = await stream.finalMessage();
      onUsage?.(usageOf(response.usage, MODEL_ID));
      continuations += 1;
    }

    return { findings: textOf(response.content), sources };
  },

  async generateStream({ system, user, tier, onText, onUsage, signal }) {
    // No tools — stream plain text (the pipeline parses NDJSON field lines).
    // "economy" stages run on the cheaper Haiku model.
    const model = tier === "economy" ? HAIKU_MODEL_ID : MODEL_ID;
    const stream = client().messages.stream(
      {
        model,
        max_tokens: WRITE_MAX_TOKENS,
        system: toSystem(system),
        messages: [{ role: "user", content: user }],
      },
      { signal },
    );
    if (onText) stream.on("text", (delta: string) => onText(delta));
    const message = await stream.finalMessage();
    onUsage?.(usageOf(message.usage, model));
    return textOf(message.content);
  },
};
