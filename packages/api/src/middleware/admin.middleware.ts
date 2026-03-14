import type { MiddlewareHandler } from "hono";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../types/index.js";
import { getDb } from "../config/database.js";
import { users } from "../db/schema.js";
import { ForbiddenError } from "./error-handler.js";

export const adminMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const userId = c.get("userId");

  const db = getDb();
  const [user] = await db
    .select({ role: users.role, banned: users.banned })
    .from(users)
    .where(eq(users.id, userId));
  if (!user) {
    throw new ForbiddenError("User not found");
  }

  if (user.banned) {
    throw new ForbiddenError("Account is banned");
  }

  if (user.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }

  await next();
};
