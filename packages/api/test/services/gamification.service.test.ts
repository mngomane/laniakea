import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@laniakea/engine", () => ({
  calculateXp: vi.fn(() => ({ base_xp: 50, multiplier: 1.5, total_xp: 75 })),
  calculateLevel: vi.fn(() => ({
    level: 2,
    total_xp: 150,
    xp_for_current_level: 100,
    xp_for_next_level: 200,
  })),
  evaluateStreak: vi.fn(() => ({
    current_streak: 3,
    longest_streak: 5,
    multiplier: 1.3,
  })),
  checkAchievements: vi.fn(() => ({
    newly_unlocked: [],
    all_statuses: [],
  })),
  sortLeaderboard: vi.fn((entries: unknown[]) => entries),
}));

import {
  calculateActivityXp,
  calculateUserLevel,
  evaluateUserStreak,
  checkUserAchievements,
  sortUserLeaderboard,
} from "../../src/services/gamification.service.js";

import {
  calculateXp,
  calculateLevel,
  evaluateStreak,
  checkAchievements,
  sortLeaderboard,
} from "@laniakea/engine";

describe("gamification.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculateActivityXp calls engine calculateXp with correct args", () => {
    const result = calculateActivityXp("Commit", 1.5);

    expect(calculateXp).toHaveBeenCalledWith("Commit", 1.5);
    expect(result).toEqual({ base_xp: 50, multiplier: 1.5, total_xp: 75 });
  });

  it("calculateUserLevel calls engine calculateLevel", () => {
    const result = calculateUserLevel(150);

    expect(calculateLevel).toHaveBeenCalledWith(150);
    expect(result.level).toBe(2);
  });

  it("evaluateUserStreak converts Date to ms and calls engine", () => {
    const date = new Date("2024-01-15T12:00:00Z");
    const result = evaluateUserStreak(date, 3, 5);

    expect(evaluateStreak).toHaveBeenCalledWith(
      date.getTime(),
      expect.any(Number),
      3,
      5,
    );
    expect(result.current_streak).toBe(3);
  });

  it("evaluateUserStreak handles null lastActivityDate", () => {
    evaluateUserStreak(null, 0, 0);

    expect(evaluateStreak).toHaveBeenCalledWith(0, expect.any(Number), 0, 0);
  });

  it("checkUserAchievements calls engine checkAchievements", () => {
    const defs = [
      {
        slug: "first-commit",
        name: "First Commit",
        description: "Make your first commit",
        required_count: 1,
      },
    ];
    const counts = [1];

    checkUserAchievements(defs, counts);

    expect(checkAchievements).toHaveBeenCalledWith(defs, counts);
  });

  it("sortUserLeaderboard calls engine sortLeaderboard", () => {
    const entries = [
      {
        user_id: "1",
        username: "alice",
        xp: 100,
        level: 1,
        current_streak: 1,
        rank: 0,
      },
    ];

    const result = sortUserLeaderboard(entries);

    expect(sortLeaderboard).toHaveBeenCalledWith(entries);
    expect(result).toEqual(entries);
  });
});
