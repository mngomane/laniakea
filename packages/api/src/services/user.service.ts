import { eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { getDb } from "../config/database.js";
import { users } from "../db/schema.js";
import type { CreateUserInput } from "../types/index.js";

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export type UserRow = typeof users.$inferSelect;
export type SafeUser = Omit<UserRow, "passwordHash">;

export function stripPasswordHash(user: UserRow): SafeUser {
  const { passwordHash: _, ...safe } = user;
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
