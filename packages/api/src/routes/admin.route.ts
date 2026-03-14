import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminMiddleware } from "../middleware/admin.middleware.js";
import type { AppEnv } from "../types/index.js";
import {
  PaginationSchema,
  UpdateUserRoleSchema,
  CreateAchievementSchema,
  UpdateAchievementSchema,
} from "../types/index.js";
import { validateUUID } from "../middleware/validate-uuid.js";
import {
  getGlobalStats,
  listUsers,
  updateUserRole,
  banUser,
  unbanUser,
  listAllTeams,
  deleteTeamAdmin,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  listAchievements,
  getRecentActivities,
} from "../services/admin.service.js";

const adminRoute = new Hono<AppEnv>();

adminRoute.use("*", authMiddleware);
adminRoute.use("*", adminMiddleware);

// Global stats
adminRoute.get("/stats", async (c) => {
  const stats = await getGlobalStats();
  return c.json(stats);
});

// List users
adminRoute.get("/users", async (c) => {
  const query = PaginationSchema.parse({
    page: c.req.query("page"),
    limit: c.req.query("limit"),
    search: c.req.query("search"),
  });
  const result = await listUsers(query);
  return c.json(result);
});

// Update user role
adminRoute.patch("/users/:id/role", validateUUID("id"), async (c) => {
  const userId = c.req.param("id");
  const body = await c.req.json();
  const input = UpdateUserRoleSchema.parse(body);
  const user = await updateUserRole(userId, input.role);
  return c.json(user);
});

// Ban/unban user
adminRoute.patch("/users/:id/ban", validateUUID("id"), async (c) => {
  const userId = c.req.param("id");
  const body = await c.req.json();
  const { banned } = body as { banned: boolean };
  const user = banned ? await banUser(userId) : await unbanUser(userId);
  return c.json(user);
});

// List teams
adminRoute.get("/teams", async (c) => {
  const query = PaginationSchema.parse({
    page: c.req.query("page"),
    limit: c.req.query("limit"),
    search: c.req.query("search"),
  });
  const result = await listAllTeams(query);
  return c.json(result);
});

// Delete team
adminRoute.delete("/teams/:id", validateUUID("id"), async (c) => {
  const teamId = c.req.param("id");
  await deleteTeamAdmin(teamId);
  return c.json({ message: "Team deleted" });
});

// List achievements
adminRoute.get("/achievements", async (c) => {
  const achievements = await listAchievements();
  return c.json(achievements);
});

// Create achievement
adminRoute.post("/achievements", async (c) => {
  const body = await c.req.json();
  const input = CreateAchievementSchema.parse(body);
  const achievement = await createAchievement(input);
  return c.json(achievement, 201);
});

// Update achievement
adminRoute.put("/achievements/:id", validateUUID("id"), async (c) => {
  const achievementId = c.req.param("id");
  const body = await c.req.json();
  const input = UpdateAchievementSchema.parse(body);
  const achievement = await updateAchievement(achievementId, input);
  return c.json(achievement);
});

// Delete achievement
adminRoute.delete("/achievements/:id", validateUUID("id"), async (c) => {
  const achievementId = c.req.param("id");
  await deleteAchievement(achievementId);
  return c.json({ message: "Achievement deleted" });
});

// Recent activities
adminRoute.get("/activities/recent", async (c) => {
  const activities = await getRecentActivities();
  return c.json(activities);
});

export { adminRoute };
