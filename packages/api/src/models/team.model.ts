import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ITeamMember {
  userId: Types.ObjectId;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
}

export interface ITeamSettings {
  isPublic: boolean;
  maxMembers: number;
}

export interface ITeamStats {
  totalXp: number;
  memberCount: number;
  weeklyXp: number;
}

export interface ITeam extends Document {
  name: string;
  slug: string;
  description: string;
  avatarUrl: string | null;
  ownerId: Types.ObjectId;
  members: ITeamMember[];
  settings: ITeamSettings;
  stats: ITeamStats;
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, required: true, trim: true, lowercase: true },
    description: { type: String, default: "" },
    avatarUrl: { type: String, default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
          role: { type: String, enum: ["owner", "admin", "member"], required: true },
          joinedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    settings: {
      type: {
        isPublic: { type: Boolean, default: true },
        maxMembers: { type: Number, default: 50 },
      },
      default: { isPublic: true, maxMembers: 50 },
    },
    stats: {
      type: {
        totalXp: { type: Number, default: 0 },
        memberCount: { type: Number, default: 0 },
        weeklyXp: { type: Number, default: 0 },
      },
      default: { totalXp: 0, memberCount: 0, weeklyXp: 0 },
    },
    inviteCode: { type: String, unique: true, required: true },
  },
  { timestamps: true },
);

teamSchema.index({ "members.userId": 1 });

export const Team = mongoose.model<ITeam>("Team", teamSchema);
