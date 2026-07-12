import Anthropic from "@anthropic-ai/sdk";
import { MODEL_ID, OCR_MODEL_ID, getAnthropicApiKey } from "@/lib/config";
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
const MAX_SEARCHES = 8; // research breadth — enough to chase each missing fact
const RESEARCH_MAX_TOKENS = 8000;
const WRITE_MAX_TOKENS = 16000;
const OCR_MAX_TOKENS = 16000;
// Per-attempt cap so a stuck request fails fast and visibly instead of hanging
// on the SDK's own ~10-minute default — well under the route's 300s budget.
const REQUEST_TIMEOUT_MS = 90_000;

// `allowed_callers: ["direct"]` is required on Haiku (it can't do programmatic
// tool calling like Sonnet/Opus, so the API otherwise rejects the tool); it's
// a no-op restriction on models that do support it, so it's safe to set
// unconditionally regardless of which model MODEL_ID points at.
const webSearchTool = {
  type: "web_search_20260209" as const,
  name: "web_search" as const,
  max_uses: MAX_SEARCHES,
  allowed_callers: ["direct" as const],
};

// Haiku 4.5 rejects `output_config.effort` outright (400: "This model does
// not support the effort parameter") — only Sonnet/Opus-tier models accept it.
const SUPPORTS_EFFORT = !MODEL_ID.startsWith("claude-haiku");

function client(): Anthropic {
  return new Anthropic({ apiKey: getAnthropicApiKey() });
}

/**
 * Render a SystemPrompt into the SDK's system param, applying `cache_control`
 * breakpoints where marked. Blocks must be ordered stable-content-first so the
 * cached prefix stays byte-identical across calls that share it (persona,
 * playbook, deck text, research findings) — see lib/diligence/prompt.ts.
 */
function toSystem(system: SystemPrompt): string | Anthropic.TextBlockParam[] {
  if (typeof system === "string") return system;
  return system.map((b) => ({
    type: "text" as const,
    text: b.text,
    ...(b.cache ? { cache_control: { type: "ephemeral" as const } } : {}),
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

/** Log cache read/write/fresh token counts so caching can be verified in dev. */
function logCacheUsage(label: string, usage: Anthropic.Usage): void {
  console.log(
    `[claude:${label}] input=${usage.input_tokens} cache_read=${usage.cache_read_input_tokens ?? 0} cache_write=${usage.cache_creation_input_tokens ?? 0} output=${usage.output_tokens}`,
  );
}

/**
 * Log the instant a call is sent, before awaiting anything. Without this, a
 * hung request produces zero output — logCacheUsage only fires on success, so
 * there'd be no way to tell "never sent" from "stuck waiting" from the logs.
 */
function logDispatch(label: string): void {
  console.log(`[claude:${label}] dispatching…`);
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
    logDispatch("transcribe");
    const stream = client().messages.stream(
      {
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
      },
      { timeout: REQUEST_TIMEOUT_MS },
    );
    const message = await stream.finalMessage();
    onUsage?.(usageOf(message.usage, OCR_MODEL_ID));
    logCacheUsage("transcribe-pdf", message.usage);
    return textOf(message.content);
  },

  async researchWeb({ system, user, onSearch, onSource, onText, onUsage }): Promise<ResearchOutput> {
    const c = client();
    const messages: Anthropic.MessageParam[] = [{ role: "user", content: user }];
    const params = {
      model: MODEL_ID,
      max_tokens: RESEARCH_MAX_TOKENS,
      system: toSystem(system),
      tools: [webSearchTool],
      ...(SUPPORTS_EFFORT ? { output_config: { effort: "medium" as const } } : {}),
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

    logDispatch("research");
    let stream = c.messages.stream({ ...params, messages }, { timeout: REQUEST_TIMEOUT_MS });
    attach(stream);
    let response = await stream.finalMessage();
    onUsage?.(usageOf(response.usage, MODEL_ID));
    logCacheUsage("research", response.usage);

    // The web_search tool runs a server-side loop; resume on pause_turn.
    let continuations = 0;
    while (response.stop_reason === "pause_turn" && continuations < MAX_CONTINUATIONS) {
      messages.push({ role: "assistant", content: response.content });
      const label = `research-continuation-${continuations + 1}`;
      logDispatch(label);
      stream = c.messages.stream({ ...params, messages }, { timeout: REQUEST_TIMEOUT_MS });
      attach(stream);
      response = await stream.finalMessage();
      onUsage?.(usageOf(response.usage, MODEL_ID));
      logCacheUsage(label, response.usage);
      continuations += 1;
    }

    return { findings: textOf(response.content), sources };
  },

  async generateStream({ system, user, onText, onUsage }) {
    // No tools — stream plain text (the pipeline parses NDJSON field lines).
    logDispatch("generate");
    const stream = client().messages.stream(
      {
        model: MODEL_ID,
        max_tokens: WRITE_MAX_TOKENS,
        system: toSystem(system),
        messages: [{ role: "user", content: user }],
      },
      { timeout: REQUEST_TIMEOUT_MS },
    );
    if (onText) stream.on("text", (delta: string) => onText(delta));
    const message = await stream.finalMessage();
    onUsage?.(usageOf(message.usage, MODEL_ID));
    logCacheUsage("generate", message.usage);
    return textOf(message.content);
  },
};
