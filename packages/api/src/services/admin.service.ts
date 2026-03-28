import { eq, desc, sql, or, ilike } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { getDb } from "../config/database.js";
import { users, activities, teams, achievements, refreshTokens } from "../db/schema.js";
import type { UserRow } from "./user.service.js";
import { NotFoundError } from "./user.service.js";
import { calculateGlobalStatsFromEngine } from "./gamification.service.js";
import type { GlobalStats } from "@laniakea/engine";
import type {
  PaginationInput,
  CreateAchievementInput,
  UpdateAchievementInput,
} from "../types/index.js";

export type AchievementRow = typeof achievements.$inferSelect;
export type TeamRow = typeof teams.$inferSelect;

/** Omit passwordHash from user rows returned by admin endpoints. */
function omitPassword<T extends { passwordHash: string | null }>(
  row: T,
): Omit<T, "passwordHash"> {
  const { passwordHash: _, ...rest } = row;
  return rest;
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const db = getDb();
  const [[userCountRow], [xpRow], [activityCountRow], [teamCountRow], [levelRow]] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db.select({ total: sql<number>`coalesce(sum(${users.xp}), 0)::int` }).from(users),
      db.select({ count: sql<number>`count(*)::int` }).from(activities),
      db.select({ count: sql<number>`count(*)::int` }).from(teams),
      db.select({ total: sql<number>`coalesce(sum(${users.level}), 0)::int` }).from(users),
    ]);

  return calculateGlobalStatsFromEngine(
    userCountRow?.count ?? 0,
    xpRow?.total ?? 0,
    activityCountRow?.count ?? 0,
    teamCountRow?.count ?? 0,
    levelRow?.total ?? 0,
  );
}

export async function listUsers(
  input: PaginationInput,
): Promise<{ users: Omit<UserRow, "passwordHash">[]; total: number }> {
  const db = getDb();
  const offset = (input.page - 1) * input.limit;

  const whereClause = input.search
    ? or(
        ilike(users.username, `%${input.search}%`),
        ilike(users.email, `%${input.search}%`),
      )
    : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .offset(offset)
      .limit(input.limit),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause),
  ]);

  return {
    users: rows.map(omitPassword),
    total: countResult[0]?.count ?? 0,
  };
}

export async function updateUserRole(
  userId: string,
  role: "user" | "admin",
): Promise<Omit<UserRow, "passwordHash">> {
  const db = getDb();
  const [user] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId))
    .returning();
  if (!user) throw new NotFoundError(`User not found: ${userId}`);
  return omitPassword(user);
}

export async function banUser(
  userId: string,
): Promise<Omit<UserRow, "passwordHash">> {
  const db = getDb();
  const [user] = await db
    .update(users)
    .set({ banned: true, bannedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  if (!user) throw new NotFoundError(`User not found: ${userId}`);

  // Invalidate all refresh tokens
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));

  return omitPassword(user);
}

export async function unbanUser(
  userId: string,
): Promise<Omit<UserRow, "passwordHash">> {
  const db = getDb();
  const [user] = await db
    .update(users)
    .set({ banned: false, bannedAt: null, bannedReason: null })
    .where(eq(users.id, userId))
    .returning();
  if (!user) throw new NotFoundError(`User not found: ${userId}`);
  return omitPassword(user);
}

export async function listAllTeams(
  input: PaginationInput,
): Promise<{ teams: TeamRow[]; total: number }> {
  const db = getDb();
  const offset = (input.page - 1) * input.limit;

  const whereClause = input.search
    ? or(
        ilike(teams.name, `%${input.search}%`),
        ilike(teams.slug, `%${input.search}%`),
      )
    : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(teams)
      .where(whereClause)
      .orderBy(desc(teams.createdAt))
      .offset(offset)
      .limit(input.limit),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(teams)
      .where(whereClause),
  ]);

  return { teams: rows, total: countResult[0]?.count ?? 0 };
}

export async function deleteTeamAdmin(teamId: string): Promise<void> {
  const db = getDb();
  const [team] = await db.select({ id: teams.id }).from(teams).where(eq(teams.id, teamId));
  if (!team) throw new NotFoundError(`Team not found: ${teamId}`);

  // ON DELETE CASCADE handles team_members cleanup
  await db.delete(teams).where(eq(teams.id, teamId));
}

export async function createAchievement(
  input: CreateAchievementInput,
): Promise<AchievementRow> {
  const db = getDb();
  const [achievement] = await db
    .insert(achievements)
    .values({ id: uuidv7(), ...input })
    .returning();
  if (!achievement) throw new Error("Failed to create achievement");
  return achievement;
}

export async function updateAchievement(
  achievementId: string,
  input: UpdateAchievementInput,
): Promise<AchievementRow> {
  const db = getDb();
  const setValues: Partial<typeof achievements.$inferInsert> = {};
  if (input.name !== undefined) setValues.name = input.name;
  if (input.description !== undefined) setValues.description = input.description;
  if (input.condition !== undefined) setValues.condition = input.condition;
  if (input.xpReward !== undefined) setValues.xpReward = input.xpReward;

  if (Object.keys(setValues).length === 0) {
    const [existing] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, achievementId));
    if (!existing) throw new NotFoundError(`Achievement not found: ${achievementId}`);
    return existing;
  }

  const [achievement] = await db
    .update(achievements)
    .set(setValues)
    .where(eq(achievements.id, achievementId))
    .returning();
  if (!achievement) throw new NotFoundError(`Achievement not found: ${achievementId}`);
  return achievement;
}

export async function deleteAchievement(achievementId: string): Promise<void> {
  const db = getDb();
  const deleted = await db
    .delete(achievements)
    .where(eq(achievements.id, achievementId))
    .returning({ id: achievements.id });
  if (deleted.length === 0) {
    throw new NotFoundError(`Achievement not found: ${achievementId}`);
  }
}

export async function listAchievements(): Promise<AchievementRow[]> {
  const db = getDb();
  return db.select().from(achievements).orderBy(desc(achievements.createdAt));
}

export async function getRecentActivities(limit = 50) {
  const db = getDb();
  const rows = await db
    .select({
      id: activities.id,
      userId: activities.userId,
      type: activities.type,
      xpAwarded: activities.xpAwarded,
      metadata: activities.metadata,
      createdAt: activities.createdAt,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(activities)
    .leftJoin(users, eq(activities.userId, users.id))
    .orderBy(desc(activities.createdAt))
    .limit(limit);
  return rows;
}

export type ActivityRecord = Awaited<ReturnType<typeof getRecentActivities>>[number];
