import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import { Hono } from "hono";
import { v7 as uuidv7 } from "uuid";
import { getDb } from "../../src/config/database.js";
import { users, activities } from "../../src/db/schema.js";
import { eq } from "drizzle-orm";
import {
  processGitHubWebhook,
  clearDeliveryCache,
} from "../../src/services/webhook.service.js";
import { webhooksRoute } from "../../src/routes/webhooks.route.js";
import { errorHandler } from "../../src/middleware/error-handler.js";

function signPayload(payload: string, secret: string): string {
  return (
    "sha256=" +
    crypto.createHmac("sha256", secret).update(payload).digest("hex")
  );
}

describe("webhook.service", () => {
  let userId: string;

  beforeEach(async () => {
    clearDeliveryCache();
    const db = getDb();
    const id = uuidv7();
    await db.insert(users).values({
      id,
      username: "webhookuser",
      githubId: "12345",
      authProvider: "github",
    });
    userId = id;
  });

  describe("processGitHubWebhook", () => {
    it("should process push events and create commit activities", async () => {
      const payload = JSON.stringify({
        commits: [
          { id: "abc123", message: "fix bug", author: { username: "webhookuser" } },
          { id: "def456", message: "add feature", author: { username: "webhookuser" } },
        ],
        sender: { id: 12345, login: "webhookuser" },
        repository: { full_name: "mngomane/laniakea" },
        ref: "refs/heads/main",
      });

      const result = await processGitHubWebhook("push", "delivery-1", payload);

      expect(result.processed).toBe(2);
      expect(result.skipped).toBe(false);

      const db = getDb();
      const rows = await db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId));
      expect(rows).toHaveLength(2);
      expect(rows[0]!.type).toBe("Commit");
    });

    it("should process pull_request opened events", async () => {
      const payload = JSON.stringify({
        action: "opened",
        pull_request: { number: 42, title: "New feature", merged: false },
        sender: { id: 12345, login: "webhookuser" },
        repository: { full_name: "mngomane/laniakea" },
      });

      const result = await processGitHubWebhook("pull_request", "delivery-2", payload);

      expect(result.processed).toBe(1);
      const db = getDb();
      const rows = await db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId));
      expect(rows[0]!.type).toBe("PullRequest");
    });

    it("should process pull_request merged events", async () => {
      const payload = JSON.stringify({
        action: "closed",
        pull_request: { number: 42, title: "Merged PR", merged: true },
        sender: { id: 12345, login: "webhookuser" },
        repository: { full_name: "mngomane/laniakea" },
      });

      const result = await processGitHubWebhook("pull_request", "delivery-3", payload);

      expect(result.processed).toBe(1);
      const db = getDb();
      const rows = await db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId));
      expect(rows[0]!.type).toBe("Merge");
    });

    it("should process pull_request_review submitted events", async () => {
      const payload = JSON.stringify({
        action: "submitted",
        review: { id: 1, state: "approved" },
        pull_request: { number: 42 },
        sender: { id: 12345, login: "webhookuser" },
        repository: { full_name: "mngomane/laniakea" },
      });

      const result = await processGitHubWebhook("pull_request_review", "delivery-4", payload);

      expect(result.processed).toBe(1);
      const db = getDb();
      const rows = await db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId));
      expect(rows[0]!.type).toBe("Review");
    });

    it("should process issues closed events", async () => {
      const payload = JSON.stringify({
        action: "closed",
        issue: { number: 10, title: "Bug fix" },
        sender: { id: 12345, login: "webhookuser" },
        repository: { full_name: "mngomane/laniakea" },
      });

      const result = await processGitHubWebhook("issues", "delivery-5", payload);

      expect(result.processed).toBe(1);
      const db = getDb();
      const rows = await db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId));
      expect(rows[0]!.type).toBe("Issue");
    });

    it("should skip duplicate delivery IDs (idempotence)", async () => {
      const payload = JSON.stringify({
        action: "closed",
        issue: { number: 10, title: "Bug fix" },
        sender: { id: 12345, login: "webhookuser" },
        repository: { full_name: "mngomane/laniakea" },
      });

      await processGitHubWebhook("issues", "delivery-dup", payload);
      const result = await processGitHubWebhook("issues", "delivery-dup", payload);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe("duplicate delivery");
      const db = getDb();
      const rows = await db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId));
      expect(rows).toHaveLength(1);
    });

    it("should skip events from unregistered GitHub users", async () => {
      const payload = JSON.stringify({
        action: "closed",
        issue: { number: 10, title: "Bug fix" },
        sender: { id: 99999, login: "unknown" },
        repository: { full_name: "mngomane/laniakea" },
      });

      const result = await processGitHubWebhook("issues", "delivery-6", payload);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe("user not found");
    });

    it("should ignore unsupported event types", async () => {
      const payload = JSON.stringify({
        sender: { id: 12345, login: "webhookuser" },
      });

      const result = await processGitHubWebhook("fork", "delivery-7", payload);

      expect(result.skipped).toBe(true);
      expect(result.reason).toContain("unsupported event");
    });

    it("should ignore PR closed without merge", async () => {
      const payload = JSON.stringify({
        action: "closed",
        pull_request: { number: 42, title: "Closed PR", merged: false },
        sender: { id: 12345, login: "webhookuser" },
        repository: { full_name: "mngomane/laniakea" },
      });

      const result = await processGitHubWebhook("pull_request", "delivery-8", payload);

      expect(result.processed).toBe(0);
    });
  });
});

describe("webhook route HMAC", () => {
  // Must match GITHUB_WEBHOOK_SECRET set in test/setup.ts
  const SECRET = "test-webhook-secret-min-32-characters-long";
  const app = new Hono();
  app.onError(errorHandler);
  app.route("/api/webhooks", webhooksRoute);

  beforeEach(() => {
    clearDeliveryCache();
  });

  it("should reject requests with invalid signature", async () => {
    const body = JSON.stringify({ sender: { id: 12345 } });
    const res = await app.request("/api/webhooks/github", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": "sha256=invalidsignature",
        "X-GitHub-Event": "push",
        "X-GitHub-Delivery": "d-1",
      },
      body,
    });

    expect(res.status).toBe(401);
  });

  it("should reject requests without signature header", async () => {
    const res = await app.request("/api/webhooks/github", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GitHub-Event": "push",
        "X-GitHub-Delivery": "d-2",
      },
      body: JSON.stringify({ sender: { id: 12345 } }),
    });

    expect(res.status).toBe(401);
  });

  it("should accept requests with valid signature", async () => {
    const body = JSON.stringify({
      sender: { id: 99999, login: "unknown" },
    });
    const signature = signPayload(body, SECRET);

    const res = await app.request("/api/webhooks/github", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": signature,
        "X-GitHub-Event": "push",
        "X-GitHub-Delivery": "d-3",
      },
      body,
    });

    expect(res.status).toBe(200);
  });
});
