import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { User } from "../../src/models/user.model.js";
import { Notification } from "../../src/models/notification.model.js";
import { NotFoundError } from "../../src/services/user.service.js";

vi.mock("../../src/ws/broadcast.js", () => ({
  broadcastNotification: vi.fn(),
  sendToUser: vi.fn(),
}));

vi.mock("../../src/services/email.service.js", () => ({
  sendNotificationEmail: vi.fn(() => Promise.resolve()),
  levelUpEmailTemplate: vi.fn(() => "<html>"),
  achievementEmailTemplate: vi.fn(() => "<html>"),
}));

import {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} from "../../src/services/notification.service.js";
import { broadcastNotification } from "../../src/ws/broadcast.js";
import { sendNotificationEmail } from "../../src/services/email.service.js";

async function createTestUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    username: `user_${new mongoose.Types.ObjectId().toString().slice(-6)}`,
    notificationPreferences: {
      inApp: true,
      email: false,
      emailDigest: "off",
      mutedTypes: [],
    },
    ...overrides,
  });
}

describe("notification.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Create notification - persists to DB
  it("creates a notification and persists it to the database", async () => {
    const user = await createTestUser();
    const userId = user._id!.toString();

    const notif = await createNotification(
      userId,
      "system",
      "Welcome",
      "Welcome to Laniakea!",
    );

    expect(notif._id).toBeDefined();
    expect(notif.userId.toString()).toBe(userId);
    expect(notif.type).toBe("system");
    expect(notif.title).toBe("Welcome");
    expect(notif.body).toBe("Welcome to Laniakea!");
    expect(notif.read).toBe(false);
    expect(notif.data).toEqual({});

    const persisted = await Notification.findById(notif._id);
    expect(persisted).not.toBeNull();
    expect(persisted!.title).toBe("Welcome");
  });

  // 2. Create notification - broadcasts if inApp enabled
  it("broadcasts via WS when inApp preference is enabled", async () => {
    const user = await createTestUser();
    const userId = user._id!.toString();

    const notif = await createNotification(
      userId,
      "achievement",
      "Badge Earned",
      "You earned the First Commit badge!",
    );

    expect(broadcastNotification).toHaveBeenCalledOnce();
    expect(broadcastNotification).toHaveBeenCalledWith(userId, {
      _id: notif._id!.toString(),
      type: "achievement",
      title: "Badge Earned",
      body: "You earned the First Commit badge!",
      data: {},
      read: false,
      createdAt: expect.any(String),
    });
  });

  // 3. Create notification - respects muted types
  it("creates notification but does not broadcast when type is muted", async () => {
    const user = await createTestUser({
      notificationPreferences: {
        inApp: true,
        email: false,
        emailDigest: "off",
        mutedTypes: ["system"],
      },
    });
    const userId = user._id!.toString();

    const notif = await createNotification(
      userId,
      "system",
      "Maintenance",
      "Scheduled maintenance tonight",
    );

    // Still persisted
    expect(notif._id).toBeDefined();
    const persisted = await Notification.findById(notif._id);
    expect(persisted).not.toBeNull();

    // But not broadcast
    expect(broadcastNotification).not.toHaveBeenCalled();
  });

  // 4. Mark as read
  it("marks a notification as read", async () => {
    const user = await createTestUser();
    const userId = user._id!.toString();

    const notif = await createNotification(
      userId,
      "level_up",
      "Level Up!",
      "You reached level 5",
    );
    expect(notif.read).toBe(false);

    await markAsRead(userId, notif._id!.toString());

    const updated = await Notification.findById(notif._id);
    expect(updated!.read).toBe(true);
  });

  // 5. Mark all as read
  it("marks all notifications as read for a user", async () => {
    const user = await createTestUser();
    const userId = user._id!.toString();

    await createNotification(userId, "system", "Notif 1", "Body 1");
    await createNotification(userId, "system", "Notif 2", "Body 2");
    await createNotification(userId, "system", "Notif 3", "Body 3");

    const countBefore = await getUnreadCount(userId);
    expect(countBefore).toBe(3);

    await markAllAsRead(userId);

    const countAfter = await getUnreadCount(userId);
    expect(countAfter).toBe(0);
  });

  // 6. Unread count
  it("returns the correct unread count", async () => {
    const user = await createTestUser();
    const userId = user._id!.toString();

    await createNotification(userId, "system", "A", "a");
    const n2 = await createNotification(userId, "system", "B", "b");
    await createNotification(userId, "system", "C", "c");

    // Mark one as read
    await markAsRead(userId, n2._id!.toString());

    const count = await getUnreadCount(userId);
    expect(count).toBe(2);
  });

  // 7. Get notifications with pagination
  it("returns paginated notifications sorted by createdAt descending", async () => {
    const user = await createTestUser();
    const userId = user._id!.toString();

    for (let i = 1; i <= 5; i++) {
      await createNotification(userId, "system", `Notif ${i}`, `Body ${i}`);
    }

    const page1 = await getUserNotifications(userId, {
      page: 1,
      limit: 2,
      unreadOnly: false,
    });
    expect(page1.notifications).toHaveLength(2);
    expect(page1.total).toBe(5);
    // Most recent first
    expect(page1.notifications[0]!.title).toBe("Notif 5");
    expect(page1.notifications[1]!.title).toBe("Notif 4");

    const page2 = await getUserNotifications(userId, {
      page: 2,
      limit: 2,
      unreadOnly: false,
    });
    expect(page2.notifications).toHaveLength(2);
    expect(page2.notifications[0]!.title).toBe("Notif 3");

    const page3 = await getUserNotifications(userId, {
      page: 3,
      limit: 2,
      unreadOnly: false,
    });
    expect(page3.notifications).toHaveLength(1);
  });

  // 8. Get notifications with unreadOnly filter
  it("filters to unread notifications only when unreadOnly is true", async () => {
    const user = await createTestUser();
    const userId = user._id!.toString();

    const n1 = await createNotification(userId, "system", "Read me", "body");
    await createNotification(userId, "system", "Unread 1", "body");
    await createNotification(userId, "system", "Unread 2", "body");

    await markAsRead(userId, n1._id!.toString());

    const result = await getUserNotifications(userId, {
      page: 1,
      limit: 10,
      unreadOnly: true,
    });
    expect(result.notifications).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.notifications.every((n) => !n.read)).toBe(true);
  });

  // 9. Delete notification
  it("deletes a notification", async () => {
    const user = await createTestUser();
    const userId = user._id!.toString();

    const notif = await createNotification(
      userId,
      "system",
      "To delete",
      "body",
    );
    const notifId = notif._id!.toString();

    await deleteNotification(userId, notifId);

    const found = await Notification.findById(notifId);
    expect(found).toBeNull();
  });

  // 10. Delete non-existent notification throws NotFoundError
  it("throws NotFoundError when deleting a non-existent notification", async () => {
    const user = await createTestUser();
    const userId = user._id!.toString();
    const fakeId = new mongoose.Types.ObjectId().toString();

    await expect(deleteNotification(userId, fakeId)).rejects.toThrow(
      NotFoundError,
    );
  });

  // 11. Mark non-existent as read throws NotFoundError
  it("throws NotFoundError when marking a non-existent notification as read", async () => {
    const user = await createTestUser();
    const userId = user._id!.toString();
    const fakeId = new mongoose.Types.ObjectId().toString();

    await expect(markAsRead(userId, fakeId)).rejects.toThrow(NotFoundError);
  });

  // 12. Create notification sends email when email pref enabled
  it("sends an email when user has email preference enabled", async () => {
    const user = await createTestUser({
      email: "dev@laniakea.io",
      notificationPreferences: {
        inApp: true,
        email: true,
        emailDigest: "instant",
        mutedTypes: [],
      },
    });
    const userId = user._id!.toString();

    await createNotification(
      userId,
      "level_up",
      "Level Up!",
      "You reached level 10",
      { level: 10 },
    );

    expect(sendNotificationEmail).toHaveBeenCalledOnce();
    expect(sendNotificationEmail).toHaveBeenCalledWith(
      "dev@laniakea.io",
      "Level Up!",
      "<html>",
    );
  });
});
