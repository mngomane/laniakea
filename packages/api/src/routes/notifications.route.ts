import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.middleware.js";
import type { AppEnv } from "../types/index.js";
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
import { getDb } from "../config/database.js";
import { users } from "../db/schema.js";
import { NotFoundError } from "../services/user.service.js";
import type { emailDigestEnum } from "../db/schema.js";
import { validateUUID } from "../middleware/validate-uuid.js";

const notificationsRoute = new Hono<AppEnv>();

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
  const db = getDb();
  const [user] = await db
    .select({
      inApp: users.notifyInApp,
      email: users.notifyEmail,
      emailDigest: users.notifyEmailDigest,
      mutedTypes: users.notifyMutedTypes,
    })
    .from(users)
    .where(eq(users.id, userId));
  if (!user) throw new NotFoundError(`User not found: ${userId}`);
  return c.json(user);
});

// Update notification preferences
notificationsRoute.put("/preferences", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const input = UpdateNotificationPreferencesSchema.parse(body);

  const db = getDb();
  const setValues: Partial<typeof users.$inferInsert> = {};
  if (input.inApp !== undefined) setValues.notifyInApp = input.inApp;
  if (input.email !== undefined) setValues.notifyEmail = input.email;
  if (input.emailDigest !== undefined) setValues.notifyEmailDigest = input.emailDigest as (typeof emailDigestEnum.enumValues)[number];
  if (input.mutedTypes !== undefined) setValues.notifyMutedTypes = input.mutedTypes;

  const [user] = await db
    .update(users)
    .set(setValues)
    .where(eq(users.id, userId))
    .returning({
      inApp: users.notifyInApp,
      email: users.notifyEmail,
      emailDigest: users.notifyEmailDigest,
      mutedTypes: users.notifyMutedTypes,
    });
  if (!user) throw new NotFoundError(`User not found: ${userId}`);
  return c.json(user);
});

// Mark one as read
notificationsRoute.patch("/:id/read", validateUUID("id"), async (c) => {
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
notificationsRoute.delete("/:id", validateUUID("id"), async (c) => {
  const userId = c.get("userId");
  const notifId = c.req.param("id");
  await deleteNotification(userId, notifId);
  return c.json({ message: "Notification deleted" });
});

export { notificationsRoute };
