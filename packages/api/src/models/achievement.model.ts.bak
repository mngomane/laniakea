import mongoose, { Schema, type Document } from "mongoose";

export interface IAchievement extends Document {
  slug: string;
  name: string;
  description: string;
  condition: string;
  xpReward: number;
}

const achievementSchema = new Schema<IAchievement>({
  slug: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  condition: { type: String, required: true },
  xpReward: { type: Number, default: 0 },
});

export const Achievement = mongoose.model<IAchievement>(
  "Achievement",
  achievementSchema,
);
