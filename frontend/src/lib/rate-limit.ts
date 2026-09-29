import { NextRequest, NextResponse } from "next/server";

type HitLog = number[];

const hits = new Map<string, HitLog>();

function prune(log: HitLog, windowStart: number): HitLog {
  let i = 0;
  while (i < log.length && log[i] <= windowStart) i += 1;
  return i === 0 ? log : log.slice(i);
}

/** In-memory sliding window. Fine for a single Node process; not shared across instances. */
export function checkRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const next = prune(hits.get(options.key) ?? [], windowStart);
  if (next.length >= options.limit) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((next[0]! + options.windowMs - now) / 1000)
    );
    hits.set(options.key, next);
    return { ok: false, retryAfterSec };
  }
  next.push(now);
  hits.set(options.key, next);
  return { ok: true };
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 64);
  return "unknown";
}

export function tooManyRequests(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { success: false, error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}

export function enforceRateLimit(
  request: NextRequest,
  bucket: string,
  limit: number,
  windowMs = 15 * 60 * 1000
): NextResponse | null {
  const result = checkRateLimit({
    key: `${bucket}:${getClientIp(request)}`,
    limit,
    windowMs,
  });
  if (!result.ok) return tooManyRequests(result.retryAfterSec);
  return null;
}
