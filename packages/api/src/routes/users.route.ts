import { Hono } from "hono";
import { CreateUserSchema } from "../types/index.js";
import type { AppEnv } from "../types/index.js";
import { createUser, getUserById, stripPasswordHash } from "../services/user.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateUUID } from "../middleware/validate-uuid.js";

export const usersRoute = new Hono<AppEnv>();

usersRoute.use("/*", authMiddleware);

usersRoute.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      400,
    );
  }
  const user = await createUser(parsed.data);
  return c.json(stripPasswordHash(user), 201);
});

usersRoute.get("/me", async (c) => {
  const userId = c.get("userId");
  const user = await getUserById(userId);
  return c.json(stripPasswordHash(user), 200);
});

usersRoute.get("/:id", validateUUID("id"), async (c) => {
  const id = c.req.param("id");
  const user = await getUserById(id);
  return c.json(stripPasswordHash(user), 200);
});
