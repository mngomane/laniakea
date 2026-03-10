import { Hono } from "hono";
import { CreateUserSchema } from "../types/index.js";
import { createUser, getUserById } from "../services/user.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const usersRoute = new Hono();

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
  return c.json(user, 201);
});

usersRoute.get("/:id", async (c) => {
  const id = c.req.param("id");
  const user = await getUserById(id);
  return c.json(user, 200);
});
