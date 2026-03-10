import {
  calculateXp,
  calculateLevel,
  evaluateStreak,
  checkAchievements,
  sortLeaderboard,
  calculateTeamStats,
  calculateGlobalStats,
} from "@laniakea/engine";
import type {
  ActivityType as EngineActivityType,
  AchievementDef,
  AchievementCheck,
  LeaderboardEntry,
  XpResult,
  LevelInfo,
  StreakResult,
  TeamStats,
  GlobalStats,
} from "@laniakea/engine";
import type { ActivityType } from "../types/index.js";

export function calculateActivityXp(
  activityType: ActivityType,
  streakMultiplier: number,
): XpResult {
  return calculateXp(activityType as EngineActivityType, streakMultiplier);
}

export function calculateUserLevel(totalXp: number): LevelInfo {
  return calculateLevel(totalXp);
}

export function evaluateUserStreak(
  lastActivityDate: Date | null,
  currentStreak: number,
  longestStreak: number,
): StreakResult {
  const lastActivityMs = lastActivityDate ? lastActivityDate.getTime() : 0;
  const currentMs = Date.now();
  return evaluateStreak(lastActivityMs, currentMs, currentStreak, longestStreak);
}

export function checkUserAchievements(
  definitions: AchievementDef[],
  counts: number[],
): AchievementCheck {
  return checkAchievements(definitions, counts);
}

export function sortUserLeaderboard(
  entries: LeaderboardEntry[],
): LeaderboardEntry[] {
  return sortLeaderboard(entries);
}

export function calculateTeamStatsFromEngine(
  memberXps: number[],
  weeklyXps: number[],
): TeamStats {
  return calculateTeamStats(memberXps, weeklyXps);
}

export function calculateGlobalStatsFromEngine(
  userCount: number,
  totalXp: number,
  totalActivities: number,
  teamCount: number,
  levelSum: number,
): GlobalStats {
  return calculateGlobalStats(userCount, totalXp, totalActivities, teamCount, levelSum);
}
