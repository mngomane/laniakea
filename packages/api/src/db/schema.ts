import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// === ENUMS STABLES ===

export const authProviderEnum = pgEnum("auth_provider", [
  "github",
  "email",
  "both",
]);

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const teamMemberRoleEnum = pgEnum("team_member_role", [
  "owner",
  "admin",
  "member",
]);

export const emailDigestEnum = pgEnum("email_digest", [
  "instant",
  "daily",
  "weekly",
  "off",
]);

// === TABLES ===

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }),
    passwordHash: varchar("password_hash", { length: 255 }),
    githubId: varchar("github_id", { length: 255 }),
    avatarUrl: text("avatar_url"),
    authProvider: authProviderEnum("auth_provider").notNull().default("email"),
    role: userRoleEnum("role").notNull().default("user"),
    banned: boolean("banned").notNull().default(false),
    bannedAt: timestamp("banned_at", { withTimezone: true }),
    bannedReason: text("banned_reason"),
    xp: integer("xp").notNull().default(0),
    level: integer("level").notNull().default(1),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastActivityDate: timestamp("last_activity_date", { withTimezone: true }),
    notifyInApp: boolean("notify_in_app").notNull().default(true),
    notifyEmail: boolean("notify_email").notNull().default(false),
    notifyEmailDigest: emailDigestEnum("notify_email_digest")
      .notNull()
      .default("off"),
    notifyMutedTypes: text("notify_muted_types")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_users_email")
      .on(table.email)
      .where(sql`${table.email} IS NOT NULL`),
    uniqueIndex("idx_users_github_id")
      .on(table.githubId)
      .where(sql`${table.githubId} IS NOT NULL`),
    index("idx_users_created_at").on(table.createdAt),
  ],
);

export const achievements = pgTable(
  "achievements",
  {
    id: uuid("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    condition: text("condition").notNull(),
    xpReward: integer("xp_reward").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_achievements_created_at").on(table.createdAt)],
);

export const userAchievements = pgTable(
  "user_achievements",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.achievementId] }),
    index("idx_user_achievements_achievement_id").on(table.achievementId),
  ],
);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    xpAwarded: integer("xp_awarded").notNull().default(0),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "chk_activity_type",
      sql`${table.type} IN ('Commit', 'PullRequest', 'Review', 'Issue', 'Merge')`,
    ),
    index("idx_activities_user_id").on(table.userId),
    index("idx_activities_created_at").on(table.createdAt),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    body: text("body").notNull(),
    data: jsonb("data").notNull().default({}),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "chk_notification_type",
      sql`${table.type} IN ('level_up', 'achievement', 'streak_record', 'team_join', 'team_kick', 'system')`,
    ),
    index("idx_notifications_user_read_created").on(
      table.userId,
      table.read,
      table.createdAt,
    ),
    index("idx_notifications_expires_at")
      .on(table.expiresAt)
      .where(sql`${table.expiresAt} IS NOT NULL`),
  ],
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey(),
    token: varchar("token", { length: 500 }).notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_refresh_tokens_user_id").on(table.userId),
    index("idx_refresh_tokens_expires_at").on(table.expiresAt),
  ],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    avatarUrl: text("avatar_url"),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isPublic: boolean("is_public").notNull().default(true),
    maxMembers: integer("max_members").notNull().default(50),
    totalXp: integer("total_xp").notNull().default(0),
    memberCount: integer("member_count").notNull().default(0),
    weeklyXp: integer("weekly_xp").notNull().default(0),
    inviteCode: varchar("invite_code", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_teams_created_at").on(table.createdAt)],
);

export const teamMembers = pgTable(
  "team_members",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: teamMemberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.teamId, table.userId] }),
    index("idx_team_members_user_id").on(table.userId),
  ],
);
