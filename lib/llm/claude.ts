import Anthropic from "@anthropic-ai/sdk";
import { MODEL_ID, OCR_MODEL_ID, getAnthropicApiKey } from "@/lib/config";
import type {
  GenerateArgs,
  LlmProvider,
  ResearchArgs,
  ResearchOutput,
  WebSource,
} from "./types";

// All Anthropic-specific knobs live here and nowhere else.
const MAX_CONTINUATIONS = 4; // safety cap for the server-side web-search loop
const MAX_SEARCHES = 4; // bound research breadth to keep latency reasonable
const RESEARCH_MAX_TOKENS = 8000;
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

/** Join the text blocks of a message into one trimmed string. */
function textOf(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/** Anthropic Claude adapter — translates the generic capabilities to the SDK. */
export const claudeProvider: LlmProvider = {
  name: "claude",

  async transcribePdf(pdf, instruction) {
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
    return textOf((await stream.finalMessage()).content);
  },

  async researchWeb({ system, user, onSearch, onSource, onText }): Promise<ResearchOutput> {
    const c = client();
    const messages: Anthropic.MessageParam[] = [{ role: "user", content: user }];
    const params = {
      model: MODEL_ID,
      max_tokens: RESEARCH_MAX_TOKENS,
      system,
      tools: [webSearchTool],
      output_config: { effort: "medium" as const },
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

    let stream = c.messages.stream({ ...params, messages });
    attach(stream);
    let response = await stream.finalMessage();

    // The web_search tool runs a server-side loop; resume on pause_turn.
    let continuations = 0;
    while (response.stop_reason === "pause_turn" && continuations < MAX_CONTINUATIONS) {
      messages.push({ role: "assistant", content: response.content });
      stream = c.messages.stream({ ...params, messages });
      attach(stream);
      response = await stream.finalMessage();
      continuations += 1;
    }

    return { findings: textOf(response.content), sources };
  },

  async generateJson({ system, user }) {
    // No tools — Claude reliably emits one JSON object from the prompt alone.
    const response = await client().messages.create({
      model: MODEL_ID,
      max_tokens: WRITE_MAX_TOKENS,
      system,
      messages: [{ role: "user", content: user }],
    });
    return textOf(response.content);
  },
};
