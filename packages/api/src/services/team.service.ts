import { nanoid } from "nanoid";
import { Team } from "../models/team.model.js";
import type { ITeam } from "../models/team.model.js";
import { User } from "../models/user.model.js";
import { NotFoundError } from "./user.service.js";
import { ForbiddenError } from "../middleware/error-handler.js";
import { calculateTeamStatsFromEngine, sortUserLeaderboard } from "./gamification.service.js";
import type { CreateTeamInput, UpdateTeamInput } from "../types/index.js";
import type { LeaderboardEntry } from "@laniakea/engine";

const MAX_TEAMS_PER_USER = 10;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createTeam(
  ownerId: string,
  input: CreateTeamInput,
): Promise<ITeam> {
  const user = await User.findById(ownerId);
  if (!user) throw new NotFoundError(`User not found: ${ownerId}`);

  if (user.teams.length >= MAX_TEAMS_PER_USER) {
    throw new ForbiddenError(`Maximum ${MAX_TEAMS_PER_USER} teams per user`);
  }

  let slug = slugify(input.name);
  const existing = await Team.findOne({ slug });
  if (existing) {
    slug = `${slug}-${nanoid(4)}`;
  }

  const inviteCode = nanoid(10);

  const team = await Team.create({
    name: input.name,
    slug,
    description: input.description ?? "",
    ownerId,
    members: [{ userId: ownerId, role: "owner", joinedAt: new Date() }],
    settings: { isPublic: input.isPublic ?? true, maxMembers: 50 },
    stats: { totalXp: user.xp, memberCount: 1, weeklyXp: 0 },
    inviteCode,
  });

  user.teams.push({ teamId: team._id as import("mongoose").Types.ObjectId, role: "owner", joinedAt: new Date() });
  await user.save();

  return team;
}

export async function getTeamBySlug(slug: string): Promise<ITeam> {
  const team = await Team.findOne({ slug });
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);
  return team;
}

export async function getPublicTeams(
  page: number,
  limit: number,
): Promise<{ teams: ITeam[]; total: number }> {
  const skip = (page - 1) * limit;
  const [teams, total] = await Promise.all([
    Team.find({ "settings.isPublic": true }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Team.countDocuments({ "settings.isPublic": true }),
  ]);
  return { teams, total };
}

export async function getUserTeams(userId: string): Promise<ITeam[]> {
  return Team.find({ "members.userId": userId }).sort({ createdAt: -1 });
}

export async function joinTeam(
  userId: string,
  slug: string,
  inviteCode: string,
): Promise<ITeam> {
  const team = await Team.findOne({ slug });
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);

  if (team.inviteCode !== inviteCode) {
    throw new ForbiddenError("Invalid invite code");
  }

  const alreadyMember = team.members.some(
    (m) => m.userId.toString() === userId,
  );
  if (alreadyMember) {
    throw new ForbiddenError("Already a member of this team");
  }

  if (team.members.length >= team.settings.maxMembers) {
    throw new ForbiddenError("Team is full");
  }

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError(`User not found: ${userId}`);

  if (user.teams.length >= MAX_TEAMS_PER_USER) {
    throw new ForbiddenError(`Maximum ${MAX_TEAMS_PER_USER} teams per user`);
  }

  team.members.push({ userId: user._id as import("mongoose").Types.ObjectId, role: "member", joinedAt: new Date() });
  team.stats.memberCount = team.members.length;
  await team.save();

  user.teams.push({ teamId: team._id as import("mongoose").Types.ObjectId, role: "member", joinedAt: new Date() });
  await user.save();

  return team;
}

export async function leaveTeam(userId: string, slug: string): Promise<void> {
  const team = await Team.findOne({ slug });
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);

  if (team.ownerId.toString() === userId) {
    throw new ForbiddenError("Owner must transfer ownership or delete the team");
  }

  const memberIndex = team.members.findIndex(
    (m) => m.userId.toString() === userId,
  );
  if (memberIndex === -1) {
    throw new NotFoundError("Not a member of this team");
  }

  team.members.splice(memberIndex, 1);
  team.stats.memberCount = team.members.length;
  await team.save();

  await User.findByIdAndUpdate(userId, {
    $pull: { teams: { teamId: team._id } },
  });
}

export async function kickMember(
  requesterId: string,
  slug: string,
  targetUserId: string,
): Promise<void> {
  const team = await Team.findOne({ slug });
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);

  const requester = team.members.find(
    (m) => m.userId.toString() === requesterId,
  );
  if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
    throw new ForbiddenError("Only team admins can kick members");
  }

  if (targetUserId === team.ownerId.toString()) {
    throw new ForbiddenError("Cannot kick the team owner");
  }

  const targetIndex = team.members.findIndex(
    (m) => m.userId.toString() === targetUserId,
  );
  if (targetIndex === -1) {
    throw new NotFoundError("Target user is not a member");
  }

  team.members.splice(targetIndex, 1);
  team.stats.memberCount = team.members.length;
  await team.save();

  await User.findByIdAndUpdate(targetUserId, {
    $pull: { teams: { teamId: team._id } },
  });
}

export async function updateMemberRole(
  requesterId: string,
  slug: string,
  targetUserId: string,
  newRole: "admin" | "member",
): Promise<void> {
  const team = await Team.findOne({ slug });
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);

  if (team.ownerId.toString() !== requesterId) {
    throw new ForbiddenError("Only the team owner can change roles");
  }

  const target = team.members.find(
    (m) => m.userId.toString() === targetUserId,
  );
  if (!target) throw new NotFoundError("Target user is not a member");

  target.role = newRole;
  await team.save();

  await User.updateOne(
    { _id: targetUserId, "teams.teamId": team._id },
    { $set: { "teams.$.role": newRole } },
  );
}

export async function updateTeam(
  requesterId: string,
  slug: string,
  updates: UpdateTeamInput,
): Promise<ITeam> {
  const team = await Team.findOne({ slug });
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);

  const requester = team.members.find(
    (m) => m.userId.toString() === requesterId,
  );
  if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
    throw new ForbiddenError("Only team admins can update the team");
  }

  if (updates.name !== undefined) team.name = updates.name;
  if (updates.description !== undefined) team.description = updates.description;
  if (updates.isPublic !== undefined) team.settings.isPublic = updates.isPublic;
  if (updates.maxMembers !== undefined) team.settings.maxMembers = updates.maxMembers;

  await team.save();
  return team;
}

export async function deleteTeam(
  requesterId: string,
  slug: string,
): Promise<void> {
  const team = await Team.findOne({ slug });
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);

  if (team.ownerId.toString() !== requesterId) {
    throw new ForbiddenError("Only the team owner can delete the team");
  }

  // Remove team references from all members
  const memberIds = team.members.map((m) => m.userId);
  await User.updateMany(
    { _id: { $in: memberIds } },
    { $pull: { teams: { teamId: team._id } } },
  );

  await Team.deleteOne({ _id: team._id });
}

export async function regenerateInviteCode(
  requesterId: string,
  slug: string,
): Promise<string> {
  const team = await Team.findOne({ slug });
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);

  const requester = team.members.find(
    (m) => m.userId.toString() === requesterId,
  );
  if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
    throw new ForbiddenError("Only team admins can regenerate invite codes");
  }

  const newCode = nanoid(10);
  team.inviteCode = newCode;
  await team.save();
  return newCode;
}

export async function recalculateTeamStats(teamId: string): Promise<void> {
  const team = await Team.findById(teamId);
  if (!team) return;

  const memberIds = team.members.map((m) => m.userId);
  const users = await User.find({ _id: { $in: memberIds } });

  const memberXps = users.map((u) => u.xp);
  // For weekly XP, we approximate using activity records
  // Simplified: just pass 0 for weekly — full implementation would query activities
  const weeklyXps = users.map(() => 0);

  const stats = calculateTeamStatsFromEngine(memberXps, weeklyXps);

  team.stats.totalXp = Number(stats.totalXp);
  team.stats.memberCount = stats.memberCount;
  team.stats.weeklyXp = Number(stats.weeklyXp);
  await team.save();
}

export async function getTeamLeaderboard(
  slug: string,
): Promise<LeaderboardEntry[]> {
  const team = await Team.findOne({ slug });
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);

  const memberIds = team.members.map((m) => m.userId);
  const users = await User.find({ _id: { $in: memberIds } });

  const entries: LeaderboardEntry[] = users.map((user) => ({
    userId: (user._id as { toString(): string }).toString(),
    username: user.username,
    xp: user.xp,
    level: user.level,
    currentStreak: user.currentStreak,
    rank: 0,
  }));

  return sortUserLeaderboard(entries);
}
