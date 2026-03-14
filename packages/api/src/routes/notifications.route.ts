import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  NotificationQuerySchema,
  UpdateNotificationPreferencesSchema,
} from "../types/index.js";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} from "../services/notification.service.js";
import { User } from "../models/user.model.js";
import { NotFoundError } from "../services/user.service.js";

interface Env { Variables: { userId: string } }
const notificationsRoute = new Hono<Env>();

notificationsRoute.use("*", authMiddleware);

// List notifications
notificationsRoute.get("/", async (c) => {
  const userId = c.get("userId");
  const query = NotificationQuerySchema.parse({
    page: c.req.query("page"),
    limit: c.req.query("limit"),
    unreadOnly: c.req.query("unreadOnly"),
  });
  const result = await getUserNotifications(userId, query);
  return c.json(result);
});

// Unread count
notificationsRoute.get("/unread-count", async (c) => {
  const userId = c.get("userId");
  const count = await getUnreadCount(userId);
  return c.json({ count });
});

// Get notification preferences
notificationsRoute.get("/preferences", async (c) => {
  const userId = c.get("userId");
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError(`User not found: ${userId}`);
  return c.json(user.notificationPreferences);
});

// Update notification preferences
notificationsRoute.put("/preferences", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const input = UpdateNotificationPreferencesSchema.parse(body);

  const update: Record<string, unknown> = {};
  if (input.inApp !== undefined) update["notificationPreferences.inApp"] = input.inApp;
  if (input.email !== undefined) update["notificationPreferences.email"] = input.email;
  if (input.emailDigest !== undefined) update["notificationPreferences.emailDigest"] = input.emailDigest;
  if (input.mutedTypes !== undefined) update["notificationPreferences.mutedTypes"] = input.mutedTypes;

  const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });
  if (!user) throw new NotFoundError(`User not found: ${userId}`);
  return c.json(user.notificationPreferences);
});

// Mark one as read
notificationsRoute.patch("/:id/read", async (c) => {
  const userId = c.get("userId");
  const notifId = c.req.param("id");
  await markAsRead(userId, notifId);
  return c.json({ message: "Marked as read" });
});

// Mark all as read
notificationsRoute.patch("/read-all", async (c) => {
  const userId = c.get("userId");
  await markAllAsRead(userId);
  return c.json({ message: "All marked as read" });
});

// Delete notification
notificationsRoute.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const notifId = c.req.param("id");
  await deleteNotification(userId, notifId);
  return c.json({ message: "Notification deleted" });
});

export { notificationsRoute };
