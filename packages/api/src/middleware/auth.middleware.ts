import type { MiddlewareHandler } from "hono";
import { verifyAccessToken } from "../services/auth.service.js";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    c.set("userId", payload.userId);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
};
