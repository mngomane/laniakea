import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { eq, or } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { getDb } from "../config/database.js";
import { users, refreshTokens } from "../db/schema.js";
import type { UserRow } from "./user.service.js";
import { env } from "../config/env.js";
import { exchangeCodeForToken, getGitHubProfile } from "./github.service.js";

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthPayload {
  userId: string;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

function generateAccessToken(userId: string): string {
  return jwt.sign({ userId } satisfies AuthPayload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

async function generateRefreshToken(userId: string): Promise<string> {
  const db = getDb();
  const token = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  await db.insert(refreshTokens).values({
    id: uuidv7(),
    token,
    userId,
    expiresAt,
  });

  return token;
}

async function generateTokens(userId: string): Promise<TokenPair> {
  const accessToken = generateAccessToken(userId);
  const refreshToken = await generateRefreshToken(userId);
  return { accessToken, refreshToken };
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<{ user: UserRow; tokens: TokenPair }> {
  const db = getDb();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.email, email), eq(users.username, username)))
    .limit(1);
  if (existing) {
    throw new AuthError("User with this email or username already exists");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const [user] = await db
    .insert(users)
    .values({
      id: uuidv7(),
      username,
      email,
      passwordHash,
      authProvider: "email",
    })
    .returning();
  if (!user) throw new Error("Failed to create user");

  const tokens = await generateTokens(user.id);
  return { user, tokens };
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: UserRow; tokens: TokenPair }> {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user || !user.passwordHash) {
    throw new AuthError("Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AuthError("Invalid email or password");
  }

  if (user.banned) {
    throw new AuthError("Account banned");
  }

  const tokens = await generateTokens(user.id);
  return { user, tokens };
}

export async function githubOAuth(
  code: string,
): Promise<{ user: UserRow; tokens: TokenPair }> {
  const db = getDb();
  const accessToken = await exchangeCodeForToken(code);
  const profile = await getGitHubProfile(accessToken);

  const githubId = String(profile.id);
  const [existingByGithub] = await db
    .select()
    .from(users)
    .where(eq(users.githubId, githubId))
    .limit(1);

  let user: UserRow;

  if (existingByGithub) {
    const updates: Partial<typeof users.$inferInsert> = {
      avatarUrl: profile.avatar_url,
    };
    if (profile.email && !existingByGithub.email) {
      updates.email = profile.email;
    }
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, existingByGithub.id))
      .returning();
    user = updated ?? existingByGithub;
  } else {
    const existingByEmail = profile.email
      ? (
          await db
            .select()
            .from(users)
            .where(eq(users.email, profile.email))
            .limit(1)
        )[0]
      : undefined;

    if (existingByEmail) {
      const newProvider =
        existingByEmail.authProvider === "email"
          ? ("both" as const)
          : existingByEmail.authProvider;
      const [updated] = await db
        .update(users)
        .set({
          githubId,
          avatarUrl: profile.avatar_url,
          authProvider: newProvider,
        })
        .where(eq(users.id, existingByEmail.id))
        .returning();
      user = updated ?? existingByEmail;
    } else {
      const [created] = await db
        .insert(users)
        .values({
          id: uuidv7(),
          username: profile.login,
          email: profile.email,
          githubId,
          avatarUrl: profile.avatar_url,
          authProvider: "github",
        })
        .returning();
      if (!created) throw new Error("Failed to create user");
      user = created;
    }
  }

  const tokens = await generateTokens(user.id);
  return { user, tokens };
}

export async function refreshAccessToken(
  token: string,
): Promise<TokenPair> {
  const db = getDb();
  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token))
    .limit(1);
  if (!stored) {
    throw new AuthError("Invalid refresh token");
  }

  if (stored.expiresAt < new Date()) {
    await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));
    throw new AuthError("Refresh token expired");
  }

  // Rotate: delete old, create new pair
  await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));
  return generateTokens(stored.userId);
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const db = getDb();
  await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
}

export function verifyAccessToken(token: string): AuthPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    return decoded;
  } catch {
    throw new AuthError("Invalid or expired access token");
  }
}
