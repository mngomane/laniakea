import { Hono } from "hono";
import type { AppEnv } from "../types/index.js";
import { getLeaderboardUsers } from "../services/user.service.js";
import { sortUserLeaderboard } from "../services/gamification.service.js";
import type { LeaderboardEntry } from "@laniakea/engine";

export const leaderboardRoute = new Hono<AppEnv>();

leaderboardRoute.get("/", async (c) => {
  const rows = await getLeaderboardUsers();

  const entries: LeaderboardEntry[] = rows.map((user) => ({
    userId: user.id,
    username: user.username,
    xp: user.xp,
    level: user.level,
    currentStreak: user.currentStreak,
    rank: 0,
  }));

  const sorted = sortUserLeaderboard(entries);
  return c.json(sorted, 200);
});
