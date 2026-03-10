import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import jwt from "jsonwebtoken";
import { User } from "../../src/models/user.model.js";
import { authMiddleware } from "../../src/middleware/auth.middleware.js";
import { adminMiddleware } from "../../src/middleware/admin.middleware.js";
import { errorHandler } from "../../src/middleware/error-handler.js";

// Ensure JWT_SECRET is set for token verification
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "dev-jwt-secret-change-in-production-min32chars";

function generateTestToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "15m" });
}

function createTestApp(): Hono {
  const app = new Hono();
  app.onError(errorHandler);
  app.use("/admin/*", authMiddleware, adminMiddleware);
  app.get("/admin/dashboard", (c) => c.json({ ok: true }));
  return app;
}

describe("adminMiddleware", () => {
  it("should allow admin users through", async () => {
    const user = await User.create({
      username: "adminuser",
      role: "admin",
      banned: false,
    });

    const app = createTestApp();
    const token = generateTestToken(
      (user._id as { toString(): string }).toString(),
    );

    const res = await app.request("/admin/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("should reject non-admin users with 403", async () => {
    const user = await User.create({
      username: "regularuser",
      role: "user",
      banned: false,
    });

    const app = createTestApp();
    const token = generateTestToken(
      (user._id as { toString(): string }).toString(),
    );

    const res = await app.request("/admin/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Admin access required");
  });

  it("should reject banned admin users with 403", async () => {
    const user = await User.create({
      username: "bannedadmin",
      role: "admin",
      banned: true,
    });

    const app = createTestApp();
    const token = generateTestToken(
      (user._id as { toString(): string }).toString(),
    );

    const res = await app.request("/admin/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Account is banned");
  });
});
