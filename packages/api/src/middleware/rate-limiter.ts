import type { Context, MiddlewareHandler } from "hono";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyFn?: (c: Context) => string;
}

export function rateLimiter(options: RateLimitOptions): MiddlewareHandler {
  const store = new Map<string, RateLimitEntry>();

  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }, options.windowMs);
  interval.unref();

  return async (c, next) => {
    const key = options.keyFn
      ? options.keyFn(c)
      : (c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
          c.req.header("x-real-ip") ??
          "unknown");

    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });
      await next();
      return;
    }

    entry.count += 1;
    if (entry.count > options.max) {
      c.header(
        "Retry-After",
        String(Math.ceil((entry.resetAt - now) / 1000)),
      );
      return c.json({ error: "Too many requests" }, 429);
    }

    await next();
  };
}
