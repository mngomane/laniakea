import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../types/index.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getDb } from "../config/database.js";
import { userAchievements, achievements } from "../db/schema.js";
import { validateUUID } from "../middleware/validate-uuid.js";

export const achievementsRoute = new Hono<AppEnv>();

achievementsRoute.use("/*", authMiddleware);

achievementsRoute.get("/:userId", validateUUID("userId"), async (c) => {
  const userId = c.req.param("userId");
  const db = getDb();
  const rows = await db
    .select({
      slug: achievements.slug,
      name: achievements.name,
      description: achievements.description,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(userAchievements)
    .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
    .where(eq(userAchievements.userId, userId));
  return c.json({ achievements: rows }, 200);
});
