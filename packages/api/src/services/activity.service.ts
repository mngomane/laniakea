import { eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { getDb } from "../config/database.js";
import { users, activities, teamMembers } from "../db/schema.js";
import type { UserRow } from "./user.service.js";
import type { RecordActivityInput } from "../types/index.js";
import {
  calculateActivityXp,
  calculateUserLevel,
  evaluateUserStreak,
} from "./gamification.service.js";
import { NotFoundError } from "./user.service.js";
import { broadcastLeaderboard } from "../ws/broadcast.js";
import { recalculateTeamStats } from "./team.service.js";
import { createNotification } from "./notification.service.js";
import type { XpResult, StreakResult } from "@laniakea/engine";

export type ActivityRow = typeof activities.$inferSelect;

export interface RecordActivityResult {
  activity: ActivityRow;
  xpResult: XpResult;
  streakResult: StreakResult;
  user: UserRow;
}

export async function recordActivity(
  input: RecordActivityInput,
): Promise<RecordActivityResult> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, input.userId));
  if (!user) {
    throw new NotFoundError(`User not found: ${input.userId}`);
  }

  const previousLevel = user.level;
  const previousLongestStreak = user.longestStreak;

  const streakResult = evaluateUserStreak(
    user.lastActivityDate,
    user.currentStreak,
    user.longestStreak,
  );

  const xpResult = calculateActivityXp(input.type, streakResult.multiplier);
  const levelInfo = calculateUserLevel(user.xp + xpResult.totalXp);

  const [updatedUser] = await db
    .update(users)
    .set({
      xp: user.xp + xpResult.totalXp,
      level: levelInfo.level,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      lastActivityDate: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  const [activity] = await db
    .insert(activities)
    .values({
      id: uuidv7(),
      userId: user.id,
      type: input.type,
      xpAwarded: xpResult.totalXp,
      metadata: input.metadata ?? {},
    })
    .returning();
  if (!activity) throw new Error("Failed to create activity");

  // Broadcast leaderboard update to WebSocket clients (fire-and-forget)
  broadcastLeaderboard().catch(() => undefined);

  // Recalculate team stats for all user's teams (fire-and-forget)
  const userTeams = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id));
  for (const entry of userTeams) {
    recalculateTeamStats(entry.teamId).catch(() => undefined);
  }

  // Notification triggers (fire-and-forget)
  if (levelInfo.level > previousLevel) {
    createNotification(
      user.id,
      "level_up",
      "Level Up!",
      `You reached Level ${levelInfo.level}!`,
      { level: levelInfo.level },
    ).catch(() => undefined);
  }

  if (streakResult.longestStreak > previousLongestStreak) {
    createNotification(
      user.id,
      "streak_record",
      "New Streak Record!",
      `Your longest streak is now ${streakResult.longestStreak} days!`,
      { streak: streakResult.longestStreak },
    ).catch(() => undefined);
  }

  return { activity, xpResult, streakResult, user: updatedUser ?? user };
}
