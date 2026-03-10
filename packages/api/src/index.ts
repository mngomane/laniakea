import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { usersRoute } from "./routes/users.route.js";
import { activitiesRoute } from "./routes/activities.route.js";
import { achievementsRoute } from "./routes/achievements.route.js";
import { leaderboardRoute } from "./routes/leaderboard.route.js";
import { authRoute } from "./routes/auth.route.js";
import { webhooksRoute } from "./routes/webhooks.route.js";
import { teamsRoute } from "./routes/teams.route.js";
import { notificationsRoute } from "./routes/notifications.route.js";
import { adminRoute } from "./routes/admin.route.js";
import { errorHandler } from "./middleware/error-handler.js";
import { setupWebSocket } from "./ws/index.js";

const app = new Hono();

app.onError(errorHandler);

app.route("/api/auth", authRoute);
app.route("/api/webhooks", webhooksRoute);
app.route("/api/users", usersRoute);
app.route("/api/activities", activitiesRoute);
app.route("/api/achievements", achievementsRoute);
app.route("/api/leaderboard", leaderboardRoute);
app.route("/api/teams", teamsRoute);
app.route("/api/notifications", notificationsRoute);
app.route("/api/admin", adminRoute);

export { app };

async function main(): Promise<void> {
  await connectDatabase(env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
  });

  setupWebSocket(server as import("node:http").Server);
  console.log("WebSocket server ready on /ws");
}

main().catch((err: unknown) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
