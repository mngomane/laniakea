import type { ErrorHandler } from "hono";
import { ZodError } from "zod";
import { NotFoundError } from "../services/user.service.js";
import { AuthError } from "../services/auth.service.js";

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof ZodError) {
    return c.json(
      { error: "Validation failed", details: err.flatten() },
      400,
    );
  }

  if (err instanceof AuthError) {
    return c.json({ error: err.message }, 401);
  }

  if (err instanceof ForbiddenError) {
    return c.json({ error: err.message }, 403);
  }

  if (err instanceof ConflictError) {
    return c.json({ error: err.message }, 409);
  }

  if (err instanceof NotFoundError) {
    return c.json({ error: err.message }, 404);
  }

  if (err instanceof SyntaxError) {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
};
