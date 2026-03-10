import type { MiddlewareHandler } from "hono";
import { User } from "../models/user.model.js";
import { ForbiddenError } from "./error-handler.js";

export const adminMiddleware: MiddlewareHandler = async (c, next) => {
  const userId = c.get("userId") as string;

  const user = await User.findById(userId).select("role banned");
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
