import { z } from "zod";

export const ActivityTypeEnum = z.enum([
  "Commit",
  "PullRequest",
  "Review",
  "Issue",
  "Merge",
]);
export type ActivityType = z.infer<typeof ActivityTypeEnum>;

export const CreateUserSchema = z.object({
  username: z.string().min(3).max(30),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const RecordActivitySchema = z.object({
  userId: z.string(),
  type: ActivityTypeEnum,
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type RecordActivityInput = z.infer<typeof RecordActivitySchema>;

export const RegisterSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export interface AuthPayload {
  userId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface GitHubProfile {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
}

export const GitHubWebhookEventTypes = [
  "push",
  "pull_request",
  "pull_request_review",
  "issues",
] as const;
export type WebhookEventType = (typeof GitHubWebhookEventTypes)[number];

// --- Teams ---

export const CreateTeamSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
});
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;

export const UpdateTeamSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  maxMembers: z.number().min(2).max(100).optional(),
});
export type UpdateTeamInput = z.infer<typeof UpdateTeamSchema>;

export const JoinTeamSchema = z.object({
  inviteCode: z.string(),
});
export type JoinTeamInput = z.infer<typeof JoinTeamSchema>;

export const TeamMemberRoleSchema = z.object({
  role: z.enum(["admin", "member"]),
});
export type TeamMemberRoleInput = z.infer<typeof TeamMemberRoleSchema>;

// --- Notifications ---

export const NotificationTypeEnum = z.enum([
  "level_up",
  "achievement",
  "streak_record",
  "team_join",
  "team_kick",
  "system",
]);
export type NotificationType = z.infer<typeof NotificationTypeEnum>;

export const UpdateNotificationPreferencesSchema = z.object({
  inApp: z.boolean().optional(),
  email: z.boolean().optional(),
  emailDigest: z.enum(["instant", "daily", "weekly", "off"]).optional(),
  mutedTypes: z.array(z.string()).optional(),
});
export type UpdateNotificationPreferencesInput = z.infer<typeof UpdateNotificationPreferencesSchema>;

export const NotificationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().default(false),
});
export type NotificationQueryInput = z.infer<typeof NotificationQuerySchema>;

// --- Admin ---

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});
export type PaginationInput = z.infer<typeof PaginationSchema>;

export const CreateAchievementSchema = z.object({
  slug: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  condition: z.string().max(200),
  xpReward: z.number().min(0).default(0),
});
export type CreateAchievementInput = z.infer<typeof CreateAchievementSchema>;

export const UpdateAchievementSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  condition: z.string().max(200).optional(),
  xpReward: z.number().min(0).optional(),
});
export type UpdateAchievementInput = z.infer<typeof UpdateAchievementSchema>;

export const UpdateUserRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;
