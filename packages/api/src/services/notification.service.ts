import { eq, and, desc, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { getDb } from "../config/database.js";
import { users, notifications } from "../db/schema.js";
import { NotFoundError } from "./user.service.js";
import { broadcastNotification } from "../ws/broadcast.js";
import { sendNotificationEmail, levelUpEmailTemplate, achievementEmailTemplate } from "./email.service.js";
import type { NotificationType } from "../types/index.js";

export type NotificationRow = typeof notifications.$inferSelect;

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<NotificationRow> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new NotFoundError(`User not found: ${userId}`);

  const [notif] = await db
    .insert(notifications)
    .values({
      id: uuidv7(),
      userId,
      type,
      title,
      body,
      data: data ?? {},
    })
    .returning();
  if (!notif) throw new Error("Failed to create notification");

  // Check if this notification type is muted
  if (user.notifyMutedTypes.includes(type)) {
    return notif;
  }

  // Real-time push if inApp enabled
  if (user.notifyInApp) {
    broadcastNotification(userId, {
      id: notif.id,
      type: notif.type,
      title: notif.title,
      body: notif.body,
      data: notif.data,
      read: notif.read,
      createdAt: notif.createdAt.toISOString(),
    });
  }

  // Email if enabled
  if (user.notifyEmail && user.email) {
    let html: string;
    if (type === "level_up") {
      html = levelUpEmailTemplate(user.username, (data?.level as number) ?? user.level);
    } else if (type === "achievement") {
      html = achievementEmailTemplate(user.username, title);
    } else {
      html = `<h2>${title}</h2><p>${body}</p>`;
    }
    sendNotificationEmail(user.email, title, html).catch(() => undefined);
  }

  return notif;
}

export async function getUserNotifications(
  userId: string,
  options: { page: number; limit: number; unreadOnly: boolean },
): Promise<{ notifications: NotificationRow[]; total: number }> {
  const db = getDb();
  const offset = (options.page - 1) * options.limit;

  const conditions = options.unreadOnly
    ? and(eq(notifications.userId, userId), eq(notifications.read, false))
    : eq(notifications.userId, userId);

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(conditions)
      .orderBy(desc(notifications.createdAt))
      .offset(offset)
      .limit(options.limit),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(conditions),
  ]);

  return { notifications: rows, total: countResult[0]?.count ?? 0 };
}

export async function markAsRead(
  userId: string,
  notifId: string,
): Promise<void> {
  const db = getDb();
  const result = await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notifId), eq(notifications.userId, userId)))
    .returning({ id: notifications.id });
  if (result.length === 0) {
    throw new NotFoundError("Notification not found");
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  const db = getDb();
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
}

export async function getUnreadCount(userId: string): Promise<number> {
  const db = getDb();
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return result?.count ?? 0;
}

export async function deleteNotification(
  userId: string,
  notifId: string,
): Promise<void> {
  const db = getDb();
  const result = await db
    .delete(notifications)
    .where(and(eq(notifications.id, notifId), eq(notifications.userId, userId)))
    .returning({ id: notifications.id });
  if (result.length === 0) {
    throw new NotFoundError("Notification not found");
  }
}
