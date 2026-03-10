import { describe, it, expect, vi } from "vitest";
import mongoose from "mongoose";
import { User } from "../../src/models/user.model.js";
import { Team } from "../../src/models/team.model.js";
import { ForbiddenError } from "../../src/middleware/error-handler.js";
import { NotFoundError } from "../../src/services/user.service.js";

// Mock the engine-dependent gamification functions
vi.mock("../../src/services/gamification.service.js", () => ({
  calculateTeamStatsFromEngine: (memberXps: number[], weeklyXps: number[]) => ({
    totalXp: memberXps.reduce((a, b) => a + b, 0),
    memberCount: memberXps.length,
    averageXp:
      memberXps.length > 0
        ? memberXps.reduce((a, b) => a + b, 0) / memberXps.length
        : 0,
    weeklyXp: weeklyXps.reduce((a, b) => a + b, 0),
  }),
  sortUserLeaderboard: (entries: Array<{ xp: number; currentStreak: number; rank: number }>) => {
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
  getPublicTeams,
  getUserTeams,
  joinTeam,
  leaveTeam,
  kickMember,
  updateMemberRole,
  updateTeam,
  deleteTeam,
  regenerateInviteCode,
  recalculateTeamStats,
  getTeamLeaderboard,
} = await import("../../src/services/team.service.js");

async function createTestUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    username: `user-${new mongoose.Types.ObjectId().toString().slice(-6)}`,
    email: null,
    passwordHash: null,
    authProvider: "email",
    ...overrides,
  });
}

describe("Team Service", () => {
  describe("createTeam", () => {
    it("should create a team with owner as first member and generate inviteCode and slug", async () => {
      const owner = await createTestUser({ xp: 100 });
      const ownerId = owner._id.toString();

      const team = await createTeam(ownerId, {
        name: "Alpha Squad",
        isPublic: true,
      });

      expect(team.name).toBe("Alpha Squad");
      expect(team.slug).toBe("alpha-squad");
      expect(team.inviteCode).toBeDefined();
      expect(team.inviteCode.length).toBe(10);
      expect(team.members).toHaveLength(1);
      expect(team.members[0].userId.toString()).toBe(ownerId);
      expect(team.members[0].role).toBe("owner");
      expect(team.stats.memberCount).toBe(1);
      expect(team.stats.totalXp).toBe(100);

      const updatedOwner = await User.findById(ownerId);
      expect(updatedOwner!.teams).toHaveLength(1);
      expect(updatedOwner!.teams[0].role).toBe("owner");
    });

    it("should add a random suffix to slug when duplicate exists", async () => {
      const owner1 = await createTestUser();
      const owner2 = await createTestUser();

      const team1 = await createTeam(owner1._id.toString(), {
        name: "Duplicate Name",
        isPublic: true,
      });
      const team2 = await createTeam(owner2._id.toString(), {
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

      const team = await createTeam(owner._id.toString(), {
        name: "Join Test",
        isPublic: true,
      });

      const updatedTeam = await joinTeam(
        joiner._id.toString(),
        team.slug,
        team.inviteCode,
      );

      expect(updatedTeam.members).toHaveLength(2);
      const joinerMember = updatedTeam.members.find(
        (m) => m.userId.toString() === joiner._id.toString(),
      );
      expect(joinerMember).toBeDefined();
      expect(joinerMember!.role).toBe("member");
      expect(updatedTeam.stats.memberCount).toBe(2);

      const updatedJoiner = await User.findById(joiner._id);
      expect(updatedJoiner!.teams).toHaveLength(1);
      expect(updatedJoiner!.teams[0].role).toBe("member");
    });

    it("should throw ForbiddenError with an invalid invite code", async () => {
      const owner = await createTestUser();
      const joiner = await createTestUser();

      const team = await createTeam(owner._id.toString(), {
        name: "Bad Code Team",
        isPublic: true,
      });

      await expect(
        joinTeam(joiner._id.toString(), team.slug, "wrong-code"),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("leaveTeam", () => {
    it("should allow a regular member to leave the team", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();

      const team = await createTeam(owner._id.toString(), {
        name: "Leave Test",
        isPublic: true,
      });
      await joinTeam(member._id.toString(), team.slug, team.inviteCode);

      await leaveTeam(member._id.toString(), team.slug);

      const updatedTeam = await getTeamBySlug(team.slug);
      expect(updatedTeam.members).toHaveLength(1);
      expect(updatedTeam.members[0].userId.toString()).toBe(owner._id.toString());

      const updatedMember = await User.findById(member._id);
      expect(updatedMember!.teams).toHaveLength(0);
    });

    it("should throw ForbiddenError when owner tries to leave", async () => {
      const owner = await createTestUser();

      const team = await createTeam(owner._id.toString(), {
        name: "Owner Leave",
        isPublic: true,
      });

      await expect(
        leaveTeam(owner._id.toString(), team.slug),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("kickMember", () => {
    it("should allow owner to kick a member", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();

      const team = await createTeam(owner._id.toString(), {
        name: "Kick Test",
        isPublic: true,
      });
      await joinTeam(member._id.toString(), team.slug, team.inviteCode);

      await kickMember(owner._id.toString(), team.slug, member._id.toString());

      const updatedTeam = await getTeamBySlug(team.slug);
      expect(updatedTeam.members).toHaveLength(1);

      const updatedMember = await User.findById(member._id);
      expect(updatedMember!.teams).toHaveLength(0);
    });

    it("should throw ForbiddenError when a regular member tries to kick", async () => {
      const owner = await createTestUser();
      const member1 = await createTestUser();
      const member2 = await createTestUser();

      const team = await createTeam(owner._id.toString(), {
        name: "Kick Unauth",
        isPublic: true,
      });
      await joinTeam(member1._id.toString(), team.slug, team.inviteCode);
      await joinTeam(member2._id.toString(), team.slug, team.inviteCode);

      await expect(
        kickMember(member1._id.toString(), team.slug, member2._id.toString()),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("max teams per user", () => {
    it("should enforce maximum of 10 teams per user", async () => {
      const user = await createTestUser();
      const userId = user._id.toString();

      for (let i = 0; i < 10; i++) {
        await createTeam(userId, {
          name: `Team ${i}`,
          isPublic: true,
        });
      }

      await expect(
        createTeam(userId, { name: "Team 11", isPublic: true }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("getTeamLeaderboard", () => {
    it("should return members sorted by XP descending with correct ranks", async () => {
      const owner = await createTestUser({ xp: 200, level: 3, currentStreak: 5 });
      const member1 = await createTestUser({ xp: 500, level: 5, currentStreak: 10 });
      const member2 = await createTestUser({ xp: 100, level: 1, currentStreak: 0 });

      const team = await createTeam(owner._id.toString(), {
        name: "Leaderboard Team",
        isPublic: true,
      });
      await joinTeam(member1._id.toString(), team.slug, team.inviteCode);
      await joinTeam(member2._id.toString(), team.slug, team.inviteCode);

      const leaderboard = await getTeamLeaderboard(team.slug);

      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0].xp).toBe(500);
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[0].userId).toBe(member1._id.toString());
      expect(leaderboard[1].xp).toBe(200);
      expect(leaderboard[1].rank).toBe(2);
      expect(leaderboard[2].xp).toBe(100);
      expect(leaderboard[2].rank).toBe(3);
    });
  });

  describe("recalculateTeamStats", () => {
    it("should recalculate totalXp and memberCount from current members", async () => {
      const owner = await createTestUser({ xp: 300 });
      const member = await createTestUser({ xp: 150 });

      const team = await createTeam(owner._id.toString(), {
        name: "Stats Team",
        isPublic: true,
      });
      await joinTeam(member._id.toString(), team.slug, team.inviteCode);

      // Manually corrupt the stats to verify recalculation fixes them
      await Team.updateOne(
        { _id: team._id },
        { $set: { "stats.totalXp": 0, "stats.memberCount": 0 } },
      );

      await recalculateTeamStats(team._id.toString());

      const updated = await Team.findById(team._id);
      expect(updated!.stats.totalXp).toBe(450);
      expect(updated!.stats.memberCount).toBe(2);
    });
  });

  describe("deleteTeam", () => {
    it("should delete the team and clean up user.teams references", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();

      const team = await createTeam(owner._id.toString(), {
        name: "Delete Me",
        isPublic: true,
      });
      await joinTeam(member._id.toString(), team.slug, team.inviteCode);

      await deleteTeam(owner._id.toString(), team.slug);

      const deletedTeam = await Team.findOne({ slug: team.slug });
      expect(deletedTeam).toBeNull();

      const updatedOwner = await User.findById(owner._id);
      expect(updatedOwner!.teams).toHaveLength(0);

      const updatedMember = await User.findById(member._id);
      expect(updatedMember!.teams).toHaveLength(0);
    });
  });

  describe("updateMemberRole", () => {
    it("should allow owner to change a member role to admin", async () => {
      const owner = await createTestUser();
      const member = await createTestUser();

      const team = await createTeam(owner._id.toString(), {
        name: "Role Test",
        isPublic: true,
      });
      await joinTeam(member._id.toString(), team.slug, team.inviteCode);

      await updateMemberRole(
        owner._id.toString(),
        team.slug,
        member._id.toString(),
        "admin",
      );

      const updatedTeam = await getTeamBySlug(team.slug);
      const updatedMember = updatedTeam.members.find(
        (m) => m.userId.toString() === member._id.toString(),
      );
      expect(updatedMember!.role).toBe("admin");

      const userDoc = await User.findById(member._id);
      const teamEntry = userDoc!.teams.find(
        (t) => t.teamId.toString() === team._id.toString(),
      );
      expect(teamEntry!.role).toBe("admin");
    });

    it("should throw ForbiddenError when non-owner tries to change roles", async () => {
      const owner = await createTestUser();
      const member1 = await createTestUser();
      const member2 = await createTestUser();

      const team = await createTeam(owner._id.toString(), {
        name: "Role Unauth",
        isPublic: true,
      });
      await joinTeam(member1._id.toString(), team.slug, team.inviteCode);
      await joinTeam(member2._id.toString(), team.slug, team.inviteCode);

      await expect(
        updateMemberRole(
          member1._id.toString(),
          team.slug,
          member2._id.toString(),
          "admin",
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("regenerateInviteCode", () => {
    it("should generate a new invite code different from the old one", async () => {
      const owner = await createTestUser();

      const team = await createTeam(owner._id.toString(), {
        name: "Regen Code",
        isPublic: true,
      });

      const oldCode = team.inviteCode;
      const newCode = await regenerateInviteCode(
        owner._id.toString(),
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
