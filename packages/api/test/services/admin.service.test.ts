import { describe, it, expect, vi } from "vitest";
import { v7 as uuidv7 } from "uuid";
import { eq } from "drizzle-orm";
import { getDb } from "../../src/config/database.js";
import { users, activities, teams, achievements, refreshTokens } from "../../src/db/schema.js";

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
      const db = getDb();
      await db.insert(users).values([
        { id: uuidv7(), username: "user1", xp: 100, level: 5 },
        { id: uuidv7(), username: "user2", xp: 200, level: 10 },
      ]);

      const userId = uuidv7();
      await db.insert(users).values({
        id: userId,
        username: "activityowner",
      });
      await db.insert(activities).values([
        { id: uuidv7(), userId, type: "Commit", xpAwarded: 50 },
        { id: uuidv7(), userId, type: "Review", xpAwarded: 30 },
      ]);

      const ownerId = uuidv7();
      await db.insert(users).values({ id: ownerId, username: "teamowner" });
      await db.insert(teams).values({
        id: uuidv7(),
        name: "Team Alpha",
        slug: "team-alpha",
        ownerId,
        inviteCode: "inv-alpha",
      });

      const stats = await getGlobalStats();

      expect(stats).toEqual({
        totalUsers: 4,
        totalXp: 300,
        totalActivities: 2,
        totalTeams: 1,
        averageLevel: expect.any(Number),
      });
    });
  });

  describe("listUsers", () => {
    it("should filter users by search term", async () => {
      const db = getDb();
      await db.insert(users).values([
        { id: uuidv7(), username: "alice", email: "alice@test.com" },
        { id: uuidv7(), username: "bob", email: "bob@test.com" },
        { id: uuidv7(), username: "alicia", email: "alicia@test.com" },
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
      const db = getDb();
      const id = uuidv7();
      await db.insert(users).values({ id, username: "promoteme", role: "user" });

      const updated = await updateUserRole(id, "admin");

      expect(updated.role).toBe("admin");

      // Verify persisted
      const [fromDb] = await db.select().from(users).where(eq(users.id, id));
      expect(fromDb?.role).toBe("admin");
    });
  });

  describe("banUser", () => {
    it("should set banned=true and delete refresh tokens", async () => {
      const db = getDb();
      const id = uuidv7();
      await db.insert(users).values({ id, username: "bannable", banned: false });

      // Create refresh tokens for this user
      await db.insert(refreshTokens).values([
        {
          id: uuidv7(),
          token: "token-1",
          userId: id,
          expiresAt: new Date(Date.now() + 86400000),
        },
        {
          id: uuidv7(),
          token: "token-2",
          userId: id,
          expiresAt: new Date(Date.now() + 86400000),
        },
      ]);

      const banned = await banUser(id);

      expect(banned.banned).toBe(true);

      // Verify refresh tokens are deleted
      const remainingTokens = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.userId, id));
      expect(remainingTokens).toHaveLength(0);
    });
  });

  describe("unbanUser", () => {
    it("should set banned=false", async () => {
      const db = getDb();
      const id = uuidv7();
      await db.insert(users).values({ id, username: "unbanthis", banned: true });

      const unbanned = await unbanUser(id);

      expect(unbanned.banned).toBe(false);

      // Verify persisted
      const [fromDb] = await db.select().from(users).where(eq(users.id, id));
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
      const db = getDb();
      const [fromDb] = await db
        .select()
        .from(achievements)
        .where(eq(achievements.slug, "first-commit"));
      expect(fromDb).toBeDefined();
      expect(fromDb?.name).toBe("First Commit");
    });
  });

  describe("deleteAchievement", () => {
    it("should remove achievement from DB", async () => {
      const db = getDb();
      const id = uuidv7();
      await db.insert(achievements).values({
        id,
        slug: "to-delete",
        name: "Delete Me",
        description: "Will be deleted",
        condition: "never",
        xpReward: 0,
      });

      await deleteAchievement(id);

      const [fromDb] = await db
        .select()
        .from(achievements)
        .where(eq(achievements.id, id));
      expect(fromDb).toBeUndefined();
    });
  });
});
