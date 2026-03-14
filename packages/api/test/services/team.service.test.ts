import { describe, it, expect, vi } from "vitest";
import { v7 as uuidv7 } from "uuid";
import { eq } from "drizzle-orm";
import { getDb } from "../../src/config/database.js";
import { users, teams, teamMembers } from "../../src/db/schema.js";
import { ForbiddenError } from "../../src/middleware/error-handler.js";

// Mock the engine-dependent gamification functions
vi.mock("../../src/services/gamification.service.js", () => ({
  calculateTeamStatsFromEngine: (memberXps: number[], weeklyXps: number[]) => ({
    totalXp: memberXps.reduce((a: number, b: number) => a + b, 0),
    memberCount: memberXps.length,
    averageXp:
      memberXps.length > 0
        ? memberXps.reduce((a: number, b: number) => a + b, 0) / memberXps.length
        : 0,
    weeklyXp: weeklyXps.reduce((a: number, b: number) => a + b, 0),
  }),
  sortUserLeaderboard: (entries: { xp: number; currentStreak: number; rank: number }[]) => {
    const sorted = [...entries].sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp;
      return b.currentStreak - a.currentStreak;
    });
    return sorted.map((e, i) => ({ ...e, rank: i + 1 }));
  },
}));

// Dynamic import after mock is set up
const {
  createTeam,
  getTeamBySlug,
  joinTeam,
  leaveTeam,
  kickMember,
  updateMemberRole,
  deleteTeam,
  regenerateInviteCode,
  recalculateTeamStats,
  getTeamLeaderboard,
} = await import("../../src/services/team.service.js");

async function createTestUser(overrides: Record<string, unknown> = {}) {
  const db = getDb();
  const id = uuidv7();
  const [user] = await db
    .insert(users)
    .values({
      id,
      username: `user-${id.slice(-6)}`,
      email: null,
      passwordHash: null,
      authProvider: "email",
      ...overrides,
    })
    .returning();
  return user!;
}

describe("Team Service", () => {
  describe("createTeam", () => {
    it("should create a team with owner as first member and generate inviteCode and slug", async () => {
      const owner = await createTestUser({ xp: 100 });

      const team = await createTeam(owner.id, {
        name: "Alpha Squad",
        isPublic: true,
      });

      expect(team.name).toBe("Alpha Squad");
      expect(team.slug).toBe("alpha-squad");
      expect(team.inviteCode).toBeDefined();
      expect(team.inviteCode.length).toBe(10);
      expect(team.memberCount).toBe(1);
      expect(team.totalXp).toBe(100);

      const db = getDb();
      const members = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.teamId, team.id));
      expect(members).toHaveLength(1);
      expect(members[0]!.userId).toBe(owner.id);
      expect(members[0]!.role).toBe("owner");
    });

    it("should add a random suffix to slug when duplicate exists", async () => {
      const owner1 = await createTestUser();
      const owner2 = await createTestUser();

      const team1 = await createTeam(owner1.id, {
        name: "Duplicate Name",
        isPublic: true,
      });
      const team2 = await createTeam(owner2.id, {
        name: "Duplicate Name",
        isPublic: true,
      });

      expect(team1.slug).toBe("duplicate-name");
      expect(team2.slug).not.toBe("duplicate-name");
      expect(team2.slug).toMatch(/^duplicate-name-.{4}$/);
    });
  });

  describe("joinTeam", () => {
    it("should let a user join with a valid invite code", async () => {
      const owner = await createTestUser({ xp: 50 });
      const joiner = await createTestUser({ xp: 30 });

      const team = await createTeam(owner.id, {
        name: "Join Test",
        isPublic: true,
      });

      const updatedTeam = await joinTeam(
        joiner.id,
        team.slug,
        team.inviteCode,
      );

      expect(updatedTeam.memberCount).toBe(2);

      const db = getDb();
      const members = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.teamId, team.id));
      expect(members).toHaveLength(2);
      const joinerMember = members.find((m) => m.userId === joiner.id);
      expect(joinerMember).toBeDefined();
      expect(joinerMember!.role).toBe("member");
    });

    it("should throw ForbiddenError with an invalid invite code", async () => {
      const owner = await createTestUser();
      const joiner = await createTestUser();

      const team = await createTeam(owner.id, {
        name: "Bad Code Team",
        isPublic: true,
      });

      await expect(
        joinTeam(joiner.id, team.slug, "wrong-code"),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("leaveTeam", () => {
    it("should allow a regular member to leave the team", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();

      const team = await createTeam(owner.id, {
        name: "Leave Test",
        isPublic: true,
      });
      await joinTeam(member.id, team.slug, team.inviteCode);

      await leaveTeam(member.id, team.slug);

      const updatedTeam = await getTeamBySlug(team.slug);
      const db = getDb();
      const members = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.teamId, updatedTeam.id));
      expect(members).toHaveLength(1);
      expect(members[0]!.userId).toBe(owner.id);
    });

    it("should throw ForbiddenError when owner tries to leave", async () => {
      const owner = await createTestUser();

      const team = await createTeam(owner.id, {
        name: "Owner Leave",
        isPublic: true,
      });

      await expect(
        leaveTeam(owner.id, team.slug),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("kickMember", () => {
    it("should allow owner to kick a member", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();

      const team = await createTeam(owner.id, {
        name: "Kick Test",
        isPublic: true,
      });
      await joinTeam(member.id, team.slug, team.inviteCode);

      await kickMember(owner.id, team.slug, member.id);

      const updatedTeam = await getTeamBySlug(team.slug);
      const db = getDb();
      const members = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.teamId, updatedTeam.id));
      expect(members).toHaveLength(1);
    });

    it("should throw ForbiddenError when a regular member tries to kick", async () => {
      const owner = await createTestUser();
      const member1 = await createTestUser();
      const member2 = await createTestUser();

      const team = await createTeam(owner.id, {
        name: "Kick Unauth",
        isPublic: true,
      });
      await joinTeam(member1.id, team.slug, team.inviteCode);
      await joinTeam(member2.id, team.slug, team.inviteCode);

      await expect(
        kickMember(member1.id, team.slug, member2.id),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("max teams per user", () => {
    it("should enforce maximum of 10 teams per user", async () => {
      const user = await createTestUser();

      for (let i = 0; i < 10; i++) {
        await createTeam(user.id, {
          name: `Team ${i}`,
          isPublic: true,
        });
      }

      await expect(
        createTeam(user.id, { name: "Team 11", isPublic: true }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("getTeamLeaderboard", () => {
    it("should return members sorted by XP descending with correct ranks", async () => {
      const owner = await createTestUser({ xp: 200, level: 3, currentStreak: 5 });
      const member1 = await createTestUser({ xp: 500, level: 5, currentStreak: 10 });
      const member2 = await createTestUser({ xp: 100, level: 1, currentStreak: 0 });

      const team = await createTeam(owner.id, {
        name: "Leaderboard Team",
        isPublic: true,
      });
      await joinTeam(member1.id, team.slug, team.inviteCode);
      await joinTeam(member2.id, team.slug, team.inviteCode);

      const leaderboard = await getTeamLeaderboard(team.slug);

      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0]!.xp).toBe(500);
      expect(leaderboard[0]!.rank).toBe(1);
      expect(leaderboard[0]!.userId).toBe(member1.id);
      expect(leaderboard[1]!.xp).toBe(200);
      expect(leaderboard[1]!.rank).toBe(2);
      expect(leaderboard[2]!.xp).toBe(100);
      expect(leaderboard[2]!.rank).toBe(3);
    });
  });

  describe("recalculateTeamStats", () => {
    it("should recalculate totalXp and memberCount from current members", async () => {
      const owner = await createTestUser({ xp: 300 });
      const member = await createTestUser({ xp: 150 });

      const team = await createTeam(owner.id, {
        name: "Stats Team",
        isPublic: true,
      });
      await joinTeam(member.id, team.slug, team.inviteCode);

      // Manually corrupt the stats to verify recalculation fixes them
      const db = getDb();
      await db
        .update(teams)
        .set({ totalXp: 0, memberCount: 0 })
        .where(eq(teams.id, team.id));

      await recalculateTeamStats(team.id);

      const [updated] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, team.id));
      expect(updated!.totalXp).toBe(450);
      expect(updated!.memberCount).toBe(2);
    });
  });

  describe("deleteTeam", () => {
    it("should delete the team and cascade-remove team_members", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();

      const team = await createTeam(owner.id, {
        name: "Delete Me",
        isPublic: true,
      });
      await joinTeam(member.id, team.slug, team.inviteCode);

      await deleteTeam(owner.id, team.slug);

      const db = getDb();
      const [deletedTeam] = await db
        .select()
        .from(teams)
        .where(eq(teams.slug, team.slug));
      expect(deletedTeam).toBeUndefined();

      // team_members cascade-deleted
      const remainingMembers = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.teamId, team.id));
      expect(remainingMembers).toHaveLength(0);
    });
  });

  describe("updateMemberRole", () => {
    it("should allow owner to change a member role to admin", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();

      const team = await createTeam(owner.id, {
        name: "Role Test",
        isPublic: true,
      });
      await joinTeam(member.id, team.slug, team.inviteCode);

      await updateMemberRole(
        owner.id,
        team.slug,
        member.id,
        "admin",
      );

      const db = getDb();
      const [updatedMember] = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.userId, member.id));
      expect(updatedMember!.role).toBe("admin");
    });

    it("should throw ForbiddenError when non-owner tries to change roles", async () => {
      const owner = await createTestUser();
      const member1 = await createTestUser();
      const member2 = await createTestUser();

      const team = await createTeam(owner.id, {
        name: "Role Unauth",
        isPublic: true,
      });
      await joinTeam(member1.id, team.slug, team.inviteCode);
      await joinTeam(member2.id, team.slug, team.inviteCode);

      await expect(
        updateMemberRole(
          member1.id,
          team.slug,
          member2.id,
          "admin",
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("regenerateInviteCode", () => {
    it("should generate a new invite code different from the old one", async () => {
      const owner = await createTestUser();

      const team = await createTeam(owner.id, {
        name: "Regen Code",
        isPublic: true,
      });

      const oldCode = team.inviteCode;
      const newCode = await regenerateInviteCode(
        owner.id,
        team.slug,
      );

      expect(newCode).toBeDefined();
      expect(newCode.length).toBe(10);
      expect(newCode).not.toBe(oldCode);

      const updatedTeam = await getTeamBySlug(team.slug);
      expect(updatedTeam.inviteCode).toBe(newCode);
    });
  });
});
