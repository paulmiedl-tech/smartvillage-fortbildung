import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Cap the history we send on each turn. The client persists the full
 * conversation in localStorage (UX), but we only need the last ~N turns
 * for context. Keeps token cost bounded as conversations grow.
 */
const MAX_HISTORY_MESSAGES = 20;

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();
  const recent = messages.slice(-MAX_HISTORY_MESSAGES);

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(recent),
    tools: {
      google_search: google.tools.googleSearch({}),
    },
    temperature: 0.5,
  });

  return result.toUIMessageStreamResponse({
    sendSources: true,
  });
}
