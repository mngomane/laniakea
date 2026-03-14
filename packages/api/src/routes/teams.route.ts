import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  CreateTeamSchema,
  UpdateTeamSchema,
  JoinTeamSchema,
  TeamMemberRoleSchema,
  PaginationSchema,
} from "../types/index.js";
import {
  createTeam,
  getTeamBySlug,
  getPublicTeams,
  getUserTeams,
  joinTeam,
  leaveTeam,
  kickMember,
  updateMemberRole,
  updateTeam,
  deleteTeam,
  regenerateInviteCode,
  getTeamLeaderboard,
} from "../services/team.service.js";

interface Env { Variables: { userId: string } }
const teamsRoute = new Hono<Env>();

teamsRoute.use("*", authMiddleware);

// Create team
teamsRoute.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const input = CreateTeamSchema.parse(body);
  const team = await createTeam(userId, input);
  return c.json(team, 201);
});

// List public teams
teamsRoute.get("/", async (c) => {
  const query = PaginationSchema.parse({
    page: c.req.query("page"),
    limit: c.req.query("limit"),
  });
  const result = await getPublicTeams(query.page, query.limit);
  return c.json(result);
});

// Get user's teams
teamsRoute.get("/my", async (c) => {
  const userId = c.get("userId");
  const teams = await getUserTeams(userId);
  return c.json(teams);
});

// Get team by slug
teamsRoute.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const team = await getTeamBySlug(slug);
  return c.json(team);
});

// Update team
teamsRoute.put("/:slug", async (c) => {
  const userId = c.get("userId");
  const slug = c.req.param("slug");
  const body = await c.req.json();
  const input = UpdateTeamSchema.parse(body);
  const team = await updateTeam(userId, slug, input);
  return c.json(team);
});

// Delete team
teamsRoute.delete("/:slug", async (c) => {
  const userId = c.get("userId");
  const slug = c.req.param("slug");
  await deleteTeam(userId, slug);
  return c.json({ message: "Team deleted" });
});

// Join team
teamsRoute.post("/:slug/join", async (c) => {
  const userId = c.get("userId");
  const slug = c.req.param("slug");
  const body = await c.req.json();
  const input = JoinTeamSchema.parse(body);
  const team = await joinTeam(userId, slug, input.inviteCode);
  return c.json(team);
});

// Leave team
teamsRoute.post("/:slug/leave", async (c) => {
  const userId = c.get("userId");
  const slug = c.req.param("slug");
  await leaveTeam(userId, slug);
  return c.json({ message: "Left team" });
});

// Kick member
teamsRoute.delete("/:slug/members/:userId", async (c) => {
  const requesterId = c.get("userId");
  const slug = c.req.param("slug");
  const targetUserId = c.req.param("userId");
  await kickMember(requesterId, slug, targetUserId);
  return c.json({ message: "Member kicked" });
});

// Update member role
teamsRoute.put("/:slug/members/:userId/role", async (c) => {
  const requesterId = c.get("userId");
  const slug = c.req.param("slug");
  const targetUserId = c.req.param("userId");
  const body = await c.req.json();
  const input = TeamMemberRoleSchema.parse(body);
  await updateMemberRole(requesterId, slug, targetUserId, input.role);
  return c.json({ message: "Role updated" });
});

// Regenerate invite code
teamsRoute.post("/:slug/regenerate-invite", async (c) => {
  const userId = c.get("userId");
  const slug = c.req.param("slug");
  const inviteCode = await regenerateInviteCode(userId, slug);
  return c.json({ inviteCode });
});

// Team leaderboard
teamsRoute.get("/:slug/leaderboard", async (c) => {
  const slug = c.req.param("slug");
  const leaderboard = await getTeamLeaderboard(slug);
  return c.json(leaderboard);
});

// Team stats
teamsRoute.get("/:slug/stats", async (c) => {
  const slug = c.req.param("slug");
  const team = await getTeamBySlug(slug);
  return c.json(team.stats);
});

export { teamsRoute };
