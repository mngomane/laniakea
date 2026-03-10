import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { User } from "../models/user.model.js";
import type { IUser } from "../models/user.model.js";
import { RefreshToken } from "../models/refresh-token.model.js";
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
  const token = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  await RefreshToken.create({ token, userId, expiresAt });

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
): Promise<{ user: IUser; tokens: TokenPair }> {
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    throw new AuthError("User with this email or username already exists");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({
    username,
    email,
    passwordHash,
    authProvider: "email",
  });

  const tokens = await generateTokens((user._id as { toString(): string }).toString());
  return { user, tokens };
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: IUser; tokens: TokenPair }> {
  const user = await User.findOne({ email });
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

  const tokens = await generateTokens((user._id as { toString(): string }).toString());
  return { user, tokens };
}

export async function githubOAuth(
  code: string,
): Promise<{ user: IUser; tokens: TokenPair }> {
  const accessToken = await exchangeCodeForToken(code);
  const profile = await getGitHubProfile(accessToken);

  const githubId = String(profile.id);
  let user = await User.findOne({ githubId });

  if (user) {
    user.avatarUrl = profile.avatar_url;
    if (profile.email && !user.email) {
      user.email = profile.email;
    }
    await user.save();
  } else {
    const existingByEmail = profile.email
      ? await User.findOne({ email: profile.email })
      : null;

    if (existingByEmail) {
      existingByEmail.githubId = githubId;
      existingByEmail.avatarUrl = profile.avatar_url;
      existingByEmail.authProvider =
        existingByEmail.authProvider === "email" ? "both" : existingByEmail.authProvider;
      await existingByEmail.save();
      user = existingByEmail;
    } else {
      user = await User.create({
        username: profile.login,
        email: profile.email,
        githubId,
        avatarUrl: profile.avatar_url,
        authProvider: "github",
      });
    }
  }

  const tokens = await generateTokens((user._id as { toString(): string }).toString());
  return { user, tokens };
}

export async function refreshAccessToken(
  token: string,
): Promise<TokenPair> {
  const stored = await RefreshToken.findOne({ token });
  if (!stored) {
    throw new AuthError("Invalid refresh token");
  }

  if (stored.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ _id: stored._id });
    throw new AuthError("Refresh token expired");
  }

  // Rotate: delete old, create new pair
  await RefreshToken.deleteOne({ _id: stored._id });
  const userId = stored.userId.toString();
  return generateTokens(userId);
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await RefreshToken.deleteOne({ token });
}

export function verifyAccessToken(token: string): AuthPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    return decoded;
  } catch {
    throw new AuthError("Invalid or expired access token");
  }
}
