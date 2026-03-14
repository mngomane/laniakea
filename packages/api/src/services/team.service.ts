import { nanoid } from "nanoid";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { getDb } from "../config/database.js";
import { users, teams, teamMembers } from "../db/schema.js";
import { NotFoundError } from "./user.service.js";
import { ForbiddenError } from "../middleware/error-handler.js";
import { calculateTeamStatsFromEngine, sortUserLeaderboard } from "./gamification.service.js";
import type { CreateTeamInput, UpdateTeamInput } from "../types/index.js";
import type { LeaderboardEntry } from "@laniakea/engine";

export type TeamRow = typeof teams.$inferSelect;
export type TeamMemberRow = typeof teamMembers.$inferSelect;

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
): Promise<TeamRow> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, ownerId));
  if (!user) throw new NotFoundError(`User not found: ${ownerId}`);

  const [teamCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(teamMembers)
    .where(eq(teamMembers.userId, ownerId));
  if ((teamCount?.count ?? 0) >= MAX_TEAMS_PER_USER) {
    throw new ForbiddenError(`Maximum ${MAX_TEAMS_PER_USER} teams per user`);
  }

  let slug = slugify(input.name);
  const [existing] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.slug, slug))
    .limit(1);
  if (existing) {
    slug = `${slug}-${nanoid(4)}`;
  }

  const inviteCode = nanoid(10);
  const teamId = uuidv7();

  const [team] = await db
    .insert(teams)
    .values({
      id: teamId,
      name: input.name,
      slug,
      description: input.description ?? "",
      ownerId,
      isPublic: input.isPublic ?? true,
      maxMembers: 50,
      totalXp: user.xp,
      memberCount: 1,
      weeklyXp: 0,
      inviteCode,
    })
    .returning();
  if (!team) throw new Error("Failed to create team");

  await db.insert(teamMembers).values({
    teamId,
    userId: ownerId,
    role: "owner",
    joinedAt: new Date(),
  });

  return team;
}

export async function getTeamBySlug(slug: string): Promise<TeamRow> {
  const db = getDb();
  const [team] = await db.select().from(teams).where(eq(teams.slug, slug));
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);
  return team;
}

export async function getPublicTeams(
  page: number,
  limit: number,
): Promise<{ teams: TeamRow[]; total: number }> {
  const db = getDb();
  const offset = (page - 1) * limit;
  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(teams)
      .where(eq(teams.isPublic, true))
      .orderBy(desc(teams.createdAt))
      .offset(offset)
      .limit(limit),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(teams)
      .where(eq(teams.isPublic, true)),
  ]);
  return { teams: rows, total: countResult[0]?.count ?? 0 };
}

export async function getUserTeams(userId: string): Promise<TeamRow[]> {
  const db = getDb();
  const memberEntries = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));
  if (memberEntries.length === 0) return [];

  const teamIds = memberEntries.map((e) => e.teamId);
  return db
    .select()
    .from(teams)
    .where(inArray(teams.id, teamIds))
    .orderBy(desc(teams.createdAt));
}

export async function joinTeam(
  userId: string,
  slug: string,
  inviteCode: string,
): Promise<TeamRow> {
  const db = getDb();
  const [team] = await db.select().from(teams).where(eq(teams.slug, slug));
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);

  if (team.inviteCode !== inviteCode) {
    throw new ForbiddenError("Invalid invite code");
  }

  const [alreadyMember] = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, userId)))
    .limit(1);
  if (alreadyMember) {
    throw new ForbiddenError("Already a member of this team");
  }

  if (team.memberCount >= team.maxMembers) {
    throw new ForbiddenError("Team is full");
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new NotFoundError(`User not found: ${userId}`);

  const [userTeamCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));
  if ((userTeamCount?.count ?? 0) >= MAX_TEAMS_PER_USER) {
    throw new ForbiddenError(`Maximum ${MAX_TEAMS_PER_USER} teams per user`);
  }

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId,
    role: "member",
    joinedAt: new Date(),
  });

  const [updated] = await db
    .update(teams)
    .set({ memberCount: team.memberCount + 1 })
    .where(eq(teams.id, team.id))
    .returning();

  return updated ?? team;
}

export async function leaveTeam(userId: string, slug: string): Promise<void> {
  const db = getDb();
  const [team] = await db.select().from(teams).where(eq(teams.slug, slug));
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);

  if (team.ownerId === userId) {
    throw new ForbiddenError("Owner must transfer ownership or delete the team");
  }

  const deleted = await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, userId)))
    .returning({ teamId: teamMembers.teamId });
  if (deleted.length === 0) {
    throw new NotFoundError("Not a member of this team");
  }

  await db
    .update(teams)
    .set({ memberCount: sql`${teams.memberCount} - 1` })
    .where(eq(teams.id, team.id));
}

export async function kickMember(
  requesterId: string,
  slug: string,
  targetUserId: string,
): Promise<void> {
  const db = getDb();
  const [team] = await db.select().from(teams).where(eq(teams.slug, slug));
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);

  const [requester] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, requesterId)));
  if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
    throw new ForbiddenError("Only team admins can kick members");
  }

  if (targetUserId === team.ownerId) {
    throw new ForbiddenError("Cannot kick the team owner");
  }

  const deleted = await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, targetUserId)))
    .returning({ teamId: teamMembers.teamId });
  if (deleted.length === 0) {
    throw new NotFoundError("Target user is not a member");
  }

  await db
    .update(teams)
    .set({ memberCount: sql`${teams.memberCount} - 1` })
    .where(eq(teams.id, team.id));
}

export async function updateMemberRole(
  requesterId: string,
  slug: string,
  targetUserId: string,
  newRole: "admin" | "member",
): Promise<void> {
  const db = getDb();
  const [team] = await db.select().from(teams).where(eq(teams.slug, slug));
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);

  if (team.ownerId !== requesterId) {
    throw new ForbiddenError("Only the team owner can change roles");
  }

  const updated = await db
    .update(teamMembers)
    .set({ role: newRole })
    .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, targetUserId)))
    .returning({ teamId: teamMembers.teamId });
  if (updated.length === 0) {
    throw new NotFoundError("Target user is not a member");
  }
}

export async function updateTeam(
  requesterId: string,
  slug: string,
  updates: UpdateTeamInput,
): Promise<TeamRow> {
  const db = getDb();
  const [team] = await db.select().from(teams).where(eq(teams.slug, slug));
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);

  const [requester] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, requesterId)));
  if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
    throw new ForbiddenError("Only team admins can update the team");
  }

  const setValues: Partial<typeof teams.$inferInsert> = {};
  if (updates.name !== undefined) setValues.name = updates.name;
  if (updates.description !== undefined) setValues.description = updates.description;
  if (updates.isPublic !== undefined) setValues.isPublic = updates.isPublic;
  if (updates.maxMembers !== undefined) setValues.maxMembers = updates.maxMembers;

  if (Object.keys(setValues).length === 0) return team;

  const [updated] = await db
    .update(teams)
    .set(setValues)
    .where(eq(teams.id, team.id))
    .returning();
  return updated ?? team;
}

export async function deleteTeam(
  requesterId: string,
  slug: string,
): Promise<void> {
  const db = getDb();
  const [team] = await db.select().from(teams).where(eq(teams.slug, slug));
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);

  if (team.ownerId !== requesterId) {
    throw new ForbiddenError("Only the team owner can delete the team");
  }

  // team_members has ON DELETE CASCADE, so deleting the team removes members
  await db.delete(teams).where(eq(teams.id, team.id));
}

export async function regenerateInviteCode(
  requesterId: string,
  slug: string,
): Promise<string> {
  const db = getDb();
  const [team] = await db.select().from(teams).where(eq(teams.slug, slug));
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);

  const [requester] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, requesterId)));
  if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
    throw new ForbiddenError("Only team admins can regenerate invite codes");
  }

  const newCode = nanoid(10);
  await db
    .update(teams)
    .set({ inviteCode: newCode })
    .where(eq(teams.id, team.id));
  return newCode;
}

export async function recalculateTeamStats(teamId: string): Promise<void> {
  const db = getDb();
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) return;

  const members = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));
  if (members.length === 0) return;

  const memberIds = members.map((m) => m.userId);
  const memberUsers = await db
    .select({ xp: users.xp })
    .from(users)
    .where(inArray(users.id, memberIds));

  const memberXps = memberUsers.map((u) => u.xp);
  const weeklyXps = memberUsers.map(() => 0);

  const stats = calculateTeamStatsFromEngine(memberXps, weeklyXps);

  await db
    .update(teams)
    .set({
      totalXp: Number(stats.totalXp),
      memberCount: stats.memberCount,
      weeklyXp: Number(stats.weeklyXp),
    })
    .where(eq(teams.id, teamId));
}

export async function getTeamLeaderboard(
  slug: string,
): Promise<LeaderboardEntry[]> {
  const db = getDb();
  const [team] = await db.select().from(teams).where(eq(teams.slug, slug));
  if (!team) throw new NotFoundError(`Team not found: ${slug}`);

  const members = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, team.id));
  if (members.length === 0) return [];

  const memberIds = members.map((m) => m.userId);
  const memberUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, memberIds));

  const entries: LeaderboardEntry[] = memberUsers.map((user) => ({
    userId: user.id,
    username: user.username,
    xp: user.xp,
    level: user.level,
    currentStreak: user.currentStreak,
    rank: 0,
  }));

  return sortUserLeaderboard(entries);
}
