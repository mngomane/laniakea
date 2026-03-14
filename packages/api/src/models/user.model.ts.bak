import mongoose, { Schema, type Document } from "mongoose";

export interface IUserTeamEntry {
  teamId: import("mongoose").Types.ObjectId;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
}

export interface INotificationPreferences {
  inApp: boolean;
  email: boolean;
  emailDigest: "instant" | "daily" | "weekly" | "off";
  mutedTypes: string[];
}

export interface IUser extends Document {
  username: string;
  email: string | null;
  passwordHash: string | null;
  githubId: string | null;
  avatarUrl: string | null;
  authProvider: "github" | "email" | "both";
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  achievements: string[];
  teams: IUserTeamEntry[];
  role: "user" | "admin";
  banned: boolean;
  notificationPreferences: INotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, unique: true, required: true, trim: true },
    email: { type: String, default: null },
    passwordHash: { type: String, default: null },
    githubId: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    authProvider: {
      type: String,
      enum: ["github", "email", "both"],
      default: "email",
    },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: null },
    achievements: { type: [String], default: [] },
    teams: {
      type: [
        {
          teamId: { type: Schema.Types.ObjectId, ref: "Team" },
          role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
          joinedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    banned: { type: Boolean, default: false },
    notificationPreferences: {
      type: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        emailDigest: { type: String, enum: ["instant", "daily", "weekly", "off"], default: "off" },
        mutedTypes: { type: [String], default: [] },
      },
      default: { inApp: true, email: false, emailDigest: "off", mutedTypes: [] },
    },
  },
  { timestamps: true },
);

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } },
);
userSchema.index(
  { githubId: 1 },
  { unique: true, partialFilterExpression: { githubId: { $type: "string" } } },
);

export const User = mongoose.model<IUser>("User", userSchema);
