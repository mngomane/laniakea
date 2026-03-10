import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IActivity extends Document {
  userId: Types.ObjectId;
  type: "Commit" | "PullRequest" | "Review" | "Issue" | "Merge";
  xpAwarded: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["Commit", "PullRequest", "Review", "Issue", "Merge"],
      required: true,
    },
    xpAwarded: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const Activity = mongoose.model<IActivity>("Activity", activitySchema);
