import { Notification } from "../models/notification.model.js";
import type { INotification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import { NotFoundError } from "./user.service.js";
import { broadcastNotification } from "../ws/broadcast.js";
import { sendNotificationEmail, levelUpEmailTemplate, achievementEmailTemplate } from "./email.service.js";
import type { NotificationType } from "../types/index.js";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<INotification> {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError(`User not found: ${userId}`);

  // Check if this notification type is muted
  if (user.notificationPreferences.mutedTypes.includes(type)) {
    // Still create the notification but don't send real-time
    const notif = await Notification.create({ userId, type, title, body, data: data ?? {} });
    return notif;
  }

  const notif = await Notification.create({ userId, type, title, body, data: data ?? {} });

  // Real-time push if inApp enabled
  if (user.notificationPreferences.inApp) {
    broadcastNotification(userId, {
      _id: (notif._id as { toString(): string }).toString(),
      type: notif.type,
      title: notif.title,
      body: notif.body,
      data: notif.data,
      read: notif.read,
      createdAt: notif.createdAt.toISOString(),
    });
  }

  // Email if enabled
  if (user.notificationPreferences.email && user.email) {
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
): Promise<{ notifications: INotification[]; total: number }> {
  const filter: Record<string, unknown> = { userId };
  if (options.unreadOnly) filter.read = false;

  const skip = (options.page - 1) * options.limit;
  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(options.limit),
    Notification.countDocuments(filter),
  ]);
  return { notifications, total };
}

export async function markAsRead(
  userId: string,
  notifId: string,
): Promise<void> {
  const result = await Notification.updateOne(
    { _id: notifId, userId },
    { read: true },
  );
  if (result.matchedCount === 0) {
    throw new NotFoundError("Notification not found");
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  await Notification.updateMany({ userId, read: false }, { read: true });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return Notification.countDocuments({ userId, read: false });
}

export async function deleteNotification(
  userId: string,
  notifId: string,
): Promise<void> {
  const result = await Notification.deleteOne({ _id: notifId, userId });
  if (result.deletedCount === 0) {
    throw new NotFoundError("Notification not found");
  }
}
