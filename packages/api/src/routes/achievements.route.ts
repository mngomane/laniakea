import { Hono } from "hono";
import { getUserById } from "../services/user.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const achievementsRoute = new Hono();

achievementsRoute.use("/*", authMiddleware);

achievementsRoute.get("/:userId", async (c) => {
  const userId = c.req.param("userId");
  const user = await getUserById(userId);
  return c.json({ achievements: user.achievements }, 200);
});
