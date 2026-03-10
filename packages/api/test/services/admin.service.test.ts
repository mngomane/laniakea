import { describe, it, expect, vi } from "vitest";
import mongoose from "mongoose";
import { User } from "../../src/models/user.model.js";
import { Activity } from "../../src/models/activity.model.js";
import { Team } from "../../src/models/team.model.js";
import { Achievement } from "../../src/models/achievement.model.js";
import { RefreshToken } from "../../src/models/refresh-token.model.js";

vi.mock("../../src/services/gamification.service.js", () => ({
  calculateGlobalStatsFromEngine: vi.fn(
    (u: number, x: number, a: number, t: number, l: number) => ({
      totalUsers: u,
      totalXp: x,
      totalActivities: a,
      totalTeams: t,
      averageLevel: u > 0 ? l / u : 0,
    }),
  ),
}));

// Import after mock so the mock is in effect
const {
  getGlobalStats,
  listUsers,
  updateUserRole,
  banUser,
  unbanUser,
  createAchievement,
  deleteAchievement,
} = await import("../../src/services/admin.service.js");

describe("admin.service", () => {
  describe("getGlobalStats", () => {
    it("should return correct aggregated stats", async () => {
      await User.create([
        { username: "user1", xp: 100, level: 5 },
        { username: "user2", xp: 200, level: 10 },
      ]);

      const userId = new mongoose.Types.ObjectId();
      await Activity.create([
        { userId, type: "Commit", xpAwarded: 50 },
        { userId, type: "Review", xpAwarded: 30 },
      ]);

      const ownerId = new mongoose.Types.ObjectId();
      await Team.create({
        name: "Team Alpha",
        slug: "team-alpha",
        ownerId,
        inviteCode: "inv-alpha",
        members: [],
      });

      const stats = await getGlobalStats();

      expect(stats).toEqual({
        totalUsers: 2,
        totalXp: 300,
        totalActivities: 2,
        totalTeams: 1,
        averageLevel: 7.5,
      });
    });
  });

  describe("listUsers", () => {
    it("should filter users by search term", async () => {
      await User.create([
        { username: "alice", email: "alice@test.com" },
        { username: "bob", email: "bob@test.com" },
        { username: "alicia", email: "alicia@test.com" },
      ]);

      const result = await listUsers({ page: 1, limit: 10, search: "ali" });

      expect(result.total).toBe(2);
      const usernames = result.users.map((u) => u.username);
      expect(usernames).toContain("alice");
      expect(usernames).toContain("alicia");
      expect(usernames).not.toContain("bob");
    });
  });

  describe("updateUserRole", () => {
    it("should change user role", async () => {
      const user = await User.create({ username: "promoteme", role: "user" });
      const userId = (user._id as { toString(): string }).toString();

      const updated = await updateUserRole(userId, "admin");

      expect(updated.role).toBe("admin");

      // Verify persisted
      const fromDb = await User.findById(userId);
      expect(fromDb?.role).toBe("admin");
    });
  });

  describe("banUser", () => {
    it("should set banned=true and delete refresh tokens", async () => {
      const user = await User.create({
        username: "bannable",
        banned: false,
      });
      const userId = (user._id as { toString(): string }).toString();

      // Create refresh tokens for this user
      await RefreshToken.create([
        {
          token: "token-1",
          userId: user._id,
          expiresAt: new Date(Date.now() + 86400000),
        },
        {
          token: "token-2",
          userId: user._id,
          expiresAt: new Date(Date.now() + 86400000),
        },
      ]);

      const banned = await banUser(userId);

      expect(banned.banned).toBe(true);

      // Verify refresh tokens are deleted
      const remainingTokens = await RefreshToken.find({ userId: user._id });
      expect(remainingTokens).toHaveLength(0);
    });
  });

  describe("unbanUser", () => {
    it("should set banned=false", async () => {
      const user = await User.create({
        username: "unbanthis",
        banned: true,
      });
      const userId = (user._id as { toString(): string }).toString();

      const unbanned = await unbanUser(userId);

      expect(unbanned.banned).toBe(false);

      // Verify persisted
      const fromDb = await User.findById(userId);
      expect(fromDb?.banned).toBe(false);
    });
  });

  describe("createAchievement", () => {
    it("should persist a new achievement", async () => {
      const input = {
        slug: "first-commit",
        name: "First Commit",
        description: "Make your first commit",
        condition: "commits >= 1",
        xpReward: 50,
      };

      const achievement = await createAchievement(input);

      expect(achievement.slug).toBe("first-commit");
      expect(achievement.name).toBe("First Commit");
      expect(achievement.xpReward).toBe(50);

      // Verify persisted in DB
      const fromDb = await Achievement.findOne({ slug: "first-commit" });
      expect(fromDb).not.toBeNull();
      expect(fromDb?.name).toBe("First Commit");
    });
  });

  describe("deleteAchievement", () => {
    it("should remove achievement from DB", async () => {
      const achievement = await Achievement.create({
        slug: "to-delete",
        name: "Delete Me",
        description: "Will be deleted",
        condition: "never",
        xpReward: 0,
      });
      const achievementId = (
        achievement._id as { toString(): string }
      ).toString();

      await deleteAchievement(achievementId);

      const fromDb = await Achievement.findById(achievementId);
      expect(fromDb).toBeNull();
    });
  });
});
