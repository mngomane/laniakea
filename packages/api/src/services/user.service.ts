import { eq, and, ne } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { getDb } from "../config/database.js";
import { users } from "../db/schema.js";
import { ConflictError } from "../middleware/error-handler.js";
import type { CreateUserInput, UpdateProfileInput } from "../types/index.js";

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export type UserRow = typeof users.$inferSelect;
export type SafeUser = Omit<UserRow, "passwordHash">;

export function stripPasswordHash(user: UserRow): SafeUser {
  const { passwordHash: _hash, ...safe } = user;
  return safe;
}

export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const db = getDb();
  const [user] = await db
    .insert(users)
    .values({ id: uuidv7(), username: input.username })
    .returning();
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function getUserById(id: string): Promise<UserRow> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) {
    throw new NotFoundError(`User not found: ${id}`);
  }
  return user;
}

export async function getAllUsers(): Promise<UserRow[]> {
  const db = getDb();
  return db.select().from(users);
}

export async function getLeaderboardUsers(): Promise<
  Pick<UserRow, "id" | "username" | "xp" | "level" | "currentStreak">[]
> {
  const db = getDb();
  return db
    .select({
      id: users.id,
      username: users.username,
      xp: users.xp,
      level: users.level,
      currentStreak: users.currentStreak,
    })
    .from(users);
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UserRow> {
  const db = getDb();

  return db.transaction(async (tx) => {
    if (input.username) {
      const [existing] = await tx
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.username, input.username), ne(users.id, userId)))
        .limit(1);
      if (existing) {
        throw new ConflictError("Username is already taken");
      }
    }

    if (input.email) {
      const [existing] = await tx
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, input.email), ne(users.id, userId)))
        .limit(1);
      if (existing) {
        throw new ConflictError("Email is already taken");
      }
    }

    const updates: Partial<typeof users.$inferInsert> = {};
    if (input.username) updates.username = input.username;
    if (input.email) updates.email = input.email;
    updates.updatedAt = new Date();

    const [updated] = await tx
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    if (!updated) throw new NotFoundError(`User not found: ${userId}`);
    return updated;
  });
}
