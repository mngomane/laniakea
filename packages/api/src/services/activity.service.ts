import { Activity } from "../models/activity.model.js";
import type { IActivity } from "../models/activity.model.js";
import { User } from "../models/user.model.js";
import type { IUser } from "../models/user.model.js";
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

export interface RecordActivityResult {
  activity: IActivity;
  xpResult: XpResult;
  streakResult: StreakResult;
  user: IUser;
}

export async function recordActivity(
  input: RecordActivityInput,
): Promise<RecordActivityResult> {
  const user = await User.findById(input.userId);
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

  user.xp += xpResult.totalXp;
  user.level = levelInfo.level;
  user.currentStreak = streakResult.currentStreak;
  user.longestStreak = streakResult.longestStreak;
  user.lastActivityDate = new Date();
  await user.save();

  const activity = await Activity.create({
    userId: user._id,
    type: input.type,
    xpAwarded: xpResult.totalXp,
    metadata: input.metadata ?? {},
  });

  // Broadcast leaderboard update to WebSocket clients (fire-and-forget)
  broadcastLeaderboard().catch(() => undefined);

  // Recalculate team stats for all user's teams (fire-and-forget)
  const userId = (user._id as { toString(): string }).toString();
  for (const teamEntry of user.teams) {
    recalculateTeamStats(teamEntry.teamId.toString()).catch(() => undefined);
  }

  // Notification triggers (fire-and-forget)
  if (levelInfo.level > previousLevel) {
    createNotification(
      userId,
      "level_up",
      "Level Up!",
      `You reached Level ${levelInfo.level}!`,
      { level: levelInfo.level },
    ).catch(() => undefined);
  }

  if (streakResult.longestStreak > previousLongestStreak) {
    createNotification(
      userId,
      "streak_record",
      "New Streak Record!",
      `Your longest streak is now ${streakResult.longestStreak} days!`,
      { streak: streakResult.longestStreak },
    ).catch(() => undefined);
  }

  return { activity, xpResult, streakResult, user };
}
