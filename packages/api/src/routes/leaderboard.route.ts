import { Hono } from "hono";
import { getAllUsers } from "../services/user.service.js";
import { sortUserLeaderboard } from "../services/gamification.service.js";
import type { LeaderboardEntry } from "@laniakea/engine";

export const leaderboardRoute = new Hono();

leaderboardRoute.get("/", async (c) => {
  const users = await getAllUsers();

  const entries: LeaderboardEntry[] = users.map((user) => ({
    userId: (user._id as { toString(): string }).toString(),
    username: user.username,
    xp: user.xp,
    level: user.level,
    currentStreak: user.currentStreak,
    rank: 0,
  }));

  const sorted = sortUserLeaderboard(entries);
  return c.json(sorted, 200);
});
