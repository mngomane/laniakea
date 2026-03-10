import { User } from "../models/user.model.js";
import type { IUser } from "../models/user.model.js";
import { Activity } from "../models/activity.model.js";
import { Team } from "../models/team.model.js";
import type { ITeam } from "../models/team.model.js";
import { Achievement } from "../models/achievement.model.js";
import type { IAchievement } from "../models/achievement.model.js";
import { RefreshToken } from "../models/refresh-token.model.js";
import { NotFoundError } from "./user.service.js";
import { calculateGlobalStatsFromEngine } from "./gamification.service.js";
import type { GlobalStats } from "@laniakea/engine";
import type {
  PaginationInput,
  CreateAchievementInput,
  UpdateAchievementInput,
} from "../types/index.js";

export async function getGlobalStats(): Promise<GlobalStats> {
  const [userCount, totalXpAgg, totalActivities, teamCount, levelSumAgg] = await Promise.all([
    User.countDocuments(),
    User.aggregate([{ $group: { _id: null, total: { $sum: "$xp" } } }]),
    Activity.countDocuments(),
    Team.countDocuments(),
    User.aggregate([{ $group: { _id: null, total: { $sum: "$level" } } }]),
  ]);

  const totalXp = totalXpAgg[0]?.total as number ?? 0;
  const levelSum = levelSumAgg[0]?.total as number ?? 0;

  return calculateGlobalStatsFromEngine(
    userCount,
    totalXp,
    totalActivities,
    teamCount,
    levelSum,
  );
}

export async function listUsers(
  input: PaginationInput,
): Promise<{ users: IUser[]; total: number }> {
  const skip = (input.page - 1) * input.limit;
  const filter: Record<string, unknown> = {};

  if (input.search) {
    filter.$or = [
      { username: { $regex: input.search, $options: "i" } },
      { email: { $regex: input.search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(input.limit),
    User.countDocuments(filter),
  ]);
  return { users, total };
}

export async function updateUserRole(
  userId: string,
  role: "user" | "admin",
): Promise<IUser> {
  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true },
  ).select("-passwordHash");
  if (!user) throw new NotFoundError(`User not found: ${userId}`);
  return user;
}

export async function banUser(userId: string): Promise<IUser> {
  const user = await User.findByIdAndUpdate(
    userId,
    { banned: true },
    { new: true },
  ).select("-passwordHash");
  if (!user) throw new NotFoundError(`User not found: ${userId}`);

  // Invalidate all refresh tokens
  await RefreshToken.deleteMany({ userId });

  return user;
}

export async function unbanUser(userId: string): Promise<IUser> {
  const user = await User.findByIdAndUpdate(
    userId,
    { banned: false },
    { new: true },
  ).select("-passwordHash");
  if (!user) throw new NotFoundError(`User not found: ${userId}`);
  return user;
}

export async function listAllTeams(
  input: PaginationInput,
): Promise<{ teams: ITeam[]; total: number }> {
  const skip = (input.page - 1) * input.limit;
  const filter: Record<string, unknown> = {};

  if (input.search) {
    filter.$or = [
      { name: { $regex: input.search, $options: "i" } },
      { slug: { $regex: input.search, $options: "i" } },
    ];
  }

  const [teams, total] = await Promise.all([
    Team.find(filter).sort({ createdAt: -1 }).skip(skip).limit(input.limit),
    Team.countDocuments(filter),
  ]);
  return { teams, total };
}

export async function deleteTeamAdmin(teamId: string): Promise<void> {
  const team = await Team.findById(teamId);
  if (!team) throw new NotFoundError(`Team not found: ${teamId}`);

  const memberIds = team.members.map((m) => m.userId);
  await User.updateMany(
    { _id: { $in: memberIds } },
    { $pull: { teams: { teamId: team._id } } },
  );

  await Team.deleteOne({ _id: team._id });
}

export async function createAchievement(
  input: CreateAchievementInput,
): Promise<IAchievement> {
  return Achievement.create(input);
}

export async function updateAchievement(
  achievementId: string,
  input: UpdateAchievementInput,
): Promise<IAchievement> {
  const achievement = await Achievement.findByIdAndUpdate(
    achievementId,
    input,
    { new: true },
  );
  if (!achievement) throw new NotFoundError(`Achievement not found: ${achievementId}`);
  return achievement;
}

export async function deleteAchievement(achievementId: string): Promise<void> {
  const result = await Achievement.deleteOne({ _id: achievementId });
  if (result.deletedCount === 0) {
    throw new NotFoundError(`Achievement not found: ${achievementId}`);
  }
}

export async function listAchievements(): Promise<IAchievement[]> {
  return Achievement.find().sort({ createdAt: -1 });
}

export async function getRecentActivities(limit: number = 50): Promise<unknown[]> {
  return Activity.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", "username avatarUrl");
}
