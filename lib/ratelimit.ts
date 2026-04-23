import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Per-IP rate limit for /api/chat to prevent cost runaway.
 *
 * Primary limiter: Upstash Redis via @upstash/ratelimit, activated when the
 * two env vars below are present (automatically injected when you add the
 * Upstash integration from the Vercel Marketplace).
 *
 * Fallback: an in-memory sliding-window counter. This works per function
 * instance (Vercel may spawn multiple warm instances), so it is weaker
 * than Redis-backed limiting but still blocks casual abuse.
 *
 * Tuning: 120 requests per hour per IP. That leaves headroom for a small
 * office NAT where multiple users share one IP (roughly 12 users at 10
 * interactions each), while still capping a runaway scraper at ~$0.25/h
 * in Gemini Flash costs.
 */

const MAX_REQUESTS = 120;
const WINDOW_LABEL = "1 h" as const;
const WINDOW_MS = 60 * 60 * 1000;

const upstashConfigured =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const ratelimit = upstashConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS, WINDOW_LABEL),
      analytics: true,
      prefix: "smartvillage:chat",
    })
  : null;

// In-memory fallback store, keyed by identifier.
const memoryStore = new Map<string, number[]>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  backend: "upstash" | "memory";
}

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  if (ratelimit) {
    const res = await ratelimit.limit(identifier);
    return {
      success: res.success,
      remaining: res.remaining,
      resetAt: res.reset,
      backend: "upstash",
    };
  }

  const now = Date.now();
  const fresh = (memoryStore.get(identifier) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );

  if (fresh.length >= MAX_REQUESTS) {
    return {
      success: false,
      remaining: 0,
      resetAt: fresh[0] + WINDOW_MS,
      backend: "memory",
    };
  }

  fresh.push(now);
  memoryStore.set(identifier, fresh);
  return {
    success: true,
    remaining: MAX_REQUESTS - fresh.length,
    resetAt: now + WINDOW_MS,
    backend: "memory",
  };
}

/**
 * Best-effort client IP extraction on Vercel. Falls back to "anonymous",
 * which means all un-identified requests share a single bucket (strict).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "anonymous";
}
