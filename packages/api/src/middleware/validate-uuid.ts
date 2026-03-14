import { z } from "zod";
import type { MiddlewareHandler } from "hono";

const uuidSchema = z.string().uuid();

export function validateUUID(...paramNames: string[]): MiddlewareHandler {
  return async (c, next) => {
    for (const name of paramNames) {
      const value = c.req.param(name);
      if (value === undefined) continue;
      const result = uuidSchema.safeParse(value);
      if (!result.success) {
        return c.json({ error: `Invalid UUID for parameter '${name}'` }, 400);
      }
    }
    await next();
  };
}
