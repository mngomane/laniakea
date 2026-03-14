import { describe, it, expect, vi, beforeEach } from "vitest";
import { v7 as uuidv7 } from "uuid";
import { eq } from "drizzle-orm";
import { getDb } from "../../src/config/database.js";
import { users, notifications } from "../../src/db/schema.js";
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
  const db = getDb();
  const id = uuidv7();
  const [user] = await db
    .insert(users)
    .values({
      id,
      username: `user_${id.slice(-6)}`,
      notifyInApp: true,
      notifyEmail: false,
      notifyEmailDigest: "off",
      notifyMutedTypes: [],
      ...overrides,
    })
    .returning();
  return user!;
}

describe("notification.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Create notification - persists to DB
  it("creates a notification and persists it to the database", async () => {
    const user = await createTestUser();
    const userId = user.id;

    const notif = await createNotification(
      userId,
      "system",
      "Welcome",
      "Welcome to Laniakea!",
    );

    expect(notif.id).toBeDefined();
    expect(notif.userId).toBe(userId);
    expect(notif.type).toBe("system");
    expect(notif.title).toBe("Welcome");
    expect(notif.body).toBe("Welcome to Laniakea!");
    expect(notif.read).toBe(false);
    expect(notif.data).toEqual({});

    const db = getDb();
    const [persisted] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notif.id));
    expect(persisted).toBeDefined();
    expect(persisted!.title).toBe("Welcome");
  });

  // 2. Create notification - broadcasts if inApp enabled
  it("broadcasts via WS when inApp preference is enabled", async () => {
    const user = await createTestUser();
    const userId = user.id;

    const notif = await createNotification(
      userId,
      "achievement",
      "Badge Earned",
      "You earned the First Commit badge!",
    );

    expect(broadcastNotification).toHaveBeenCalledOnce();
    expect(broadcastNotification).toHaveBeenCalledWith(userId, {
      id: notif.id,
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
      notifyInApp: true,
      notifyEmail: false,
      notifyEmailDigest: "off",
      notifyMutedTypes: ["system"],
    });
    const userId = user.id;

    const notif = await createNotification(
      userId,
      "system",
      "Maintenance",
      "Scheduled maintenance tonight",
    );

    // Still persisted
    expect(notif.id).toBeDefined();
    const db = getDb();
    const [persisted] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notif.id));
    expect(persisted).toBeDefined();

    // But not broadcast
    expect(broadcastNotification).not.toHaveBeenCalled();
  });

  // 4. Mark as read
  it("marks a notification as read", async () => {
    const user = await createTestUser();
    const userId = user.id;

    const notif = await createNotification(
      userId,
      "level_up",
      "Level Up!",
      "You reached level 5",
    );
    expect(notif.read).toBe(false);

    await markAsRead(userId, notif.id);

    const db = getDb();
    const [updated] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notif.id));
    expect(updated!.read).toBe(true);
  });

  // 5. Mark all as read
  it("marks all notifications as read for a user", async () => {
    const user = await createTestUser();
    const userId = user.id;

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
    const userId = user.id;

    await createNotification(userId, "system", "A", "a");
    const n2 = await createNotification(userId, "system", "B", "b");
    await createNotification(userId, "system", "C", "c");

    // Mark one as read
    await markAsRead(userId, n2.id);

    const count = await getUnreadCount(userId);
    expect(count).toBe(2);
  });

  // 7. Get notifications with pagination
  it("returns paginated notifications sorted by createdAt descending", async () => {
    const user = await createTestUser();
    const userId = user.id;

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
    const userId = user.id;

    const n1 = await createNotification(userId, "system", "Read me", "body");
    await createNotification(userId, "system", "Unread 1", "body");
    await createNotification(userId, "system", "Unread 2", "body");

    await markAsRead(userId, n1.id);

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
    const userId = user.id;

    const notif = await createNotification(
      userId,
      "system",
      "To delete",
      "body",
    );
    const notifId = notif.id;

    await deleteNotification(userId, notifId);

    const db = getDb();
    const [found] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notifId));
    expect(found).toBeUndefined();
  });

  // 10. Delete non-existent notification throws NotFoundError
  it("throws NotFoundError when deleting a non-existent notification", async () => {
    const user = await createTestUser();
    const userId = user.id;
    const fakeId = uuidv7();

    await expect(deleteNotification(userId, fakeId)).rejects.toThrow(
      NotFoundError,
    );
  });

  // 11. Mark non-existent as read throws NotFoundError
  it("throws NotFoundError when marking a non-existent notification as read", async () => {
    const user = await createTestUser();
    const userId = user.id;
    const fakeId = uuidv7();

    await expect(markAsRead(userId, fakeId)).rejects.toThrow(NotFoundError);
  });

  // 12. Create notification sends email when email pref enabled
  it("sends an email when user has email preference enabled", async () => {
    const user = await createTestUser({
      email: "dev@laniakea.io",
      notifyInApp: true,
      notifyEmail: true,
      notifyEmailDigest: "instant",
      notifyMutedTypes: [],
    });
    const userId = user.id;

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
