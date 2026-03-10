import { Hono } from "hono";
import { RecordActivitySchema } from "../types/index.js";
import { recordActivity } from "../services/activity.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const activitiesRoute = new Hono();

activitiesRoute.use("/*", authMiddleware);

activitiesRoute.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = RecordActivitySchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      400,
    );
  }
  const result = await recordActivity(parsed.data);
  return c.json(result, 201);
});
