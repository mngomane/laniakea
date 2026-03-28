import { Hono } from "hono";
import { CreateUserSchema, UpdateProfileSchema, ChangePasswordSchema, SetPasswordSchema, UnlinkGitHubSchema } from "../types/index.js";
import type { AppEnv } from "../types/index.js";
import { createUser, getUserById, stripPasswordHash, updateUserProfile } from "../services/user.service.js";
import { changePassword, setPassword, unlinkGitHub, removePassword } from "../services/auth.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateUUID } from "../middleware/validate-uuid.js";
import { rateLimiter } from "../middleware/rate-limiter.js";

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
  return c.json({ user: stripPasswordHash(user) }, 201);
});

usersRoute.get("/me", async (c) => {
  const userId = c.get("userId");
  const user = await getUserById(userId);
  return c.json({ user: stripPasswordHash(user) }, 200);
});

usersRoute.patch(
  "/me",
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 10, keyFn: (c) => c.get("userId") }),
  async (c) => {
    const userId = c.get("userId");
    const body = await c.req.json();
    const input = UpdateProfileSchema.parse(body);

    // Require password verification to change email
    if (input.email) {
      const currentPassword = (body as { currentPassword?: string }).currentPassword;
      if (!currentPassword) {
        return c.json({ error: "Password required to change email" }, 400);
      }
      const user = await getUserById(userId);
      if (!user.passwordHash) {
        return c.json({ error: "No password set — cannot verify identity" }, 400);
      }
      const bcrypt = await import("bcrypt");
      const valid = await bcrypt.default.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return c.json({ error: "Incorrect password" }, 401);
      }
    }

    const user = await updateUserProfile(userId, input);
    return c.json({ user: stripPasswordHash(user) }, 200);
  },
);

usersRoute.post(
  "/me/password",
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyFn: (c) => c.get("userId"),
  }),
  async (c) => {
    const userId = c.get("userId");
    const body = await c.req.json();
    const input = ChangePasswordSchema.parse(body);
    await changePassword(userId, input.currentPassword, input.newPassword);
    return c.json({ message: "Password changed successfully" }, 200);
  },
);

const sensitiveLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyFn: (c) => c.get("userId"),
});

usersRoute.post("/me/set-password", sensitiveLimiter, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const input = SetPasswordSchema.parse(body);
  await setPassword(userId, input.password);
  const user = await getUserById(userId);
  return c.json({ user: stripPasswordHash(user) }, 200);
});

usersRoute.post("/me/unlink-github", sensitiveLimiter, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const input = UnlinkGitHubSchema.parse(body);
  await unlinkGitHub(userId, input.password);
  const user = await getUserById(userId);
  return c.json({ user: stripPasswordHash(user) }, 200);
});

usersRoute.post("/me/remove-password", sensitiveLimiter, async (c) => {
  const userId = c.get("userId");
  await removePassword(userId);
  const user = await getUserById(userId);
  return c.json({ user: stripPasswordHash(user) }, 200);
});

usersRoute.get("/:id", validateUUID("id"), async (c) => {
  const id = c.req.param("id");
  const user = await getUserById(id);
  return c.json({ user: stripPasswordHash(user) }, 200);
});
