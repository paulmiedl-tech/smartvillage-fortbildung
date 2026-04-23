import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

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

  const ip = getClientIp(req);
  const rate = await checkRateLimit(`chat:${ip}`);
  if (!rate.success) {
    const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000));
    return new Response(
      JSON.stringify({
        error:
          "Du hast gerade viele Nachrichten geschickt. Bitte versuch es in ein paar Minuten nochmal.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(rate.resetAt / 1000)),
        },
      },
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
    headers: {
      "X-RateLimit-Remaining": String(rate.remaining),
      "X-RateLimit-Reset": String(Math.ceil(rate.resetAt / 1000)),
    },
  });
}
