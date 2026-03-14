import { Hono } from "hono";
import type { AppEnv } from "../types/index.js";
import { webhookSignatureMiddleware, getRawBody } from "../middleware/webhook.middleware.js";
import { processGitHubWebhook } from "../services/webhook.service.js";

export const webhooksRoute = new Hono<AppEnv>();

webhooksRoute.post("/github", webhookSignatureMiddleware, async (c) => {
  const eventType = c.req.header("X-GitHub-Event");
  const deliveryId = c.req.header("X-GitHub-Delivery");

  if (!eventType || !deliveryId) {
    return c.json({ error: "Missing required GitHub webhook headers" }, 400);
  }

  const body = getRawBody(deliveryId);
  if (!body) {
    return c.json({ error: "Could not read webhook body" }, 500);
  }

  const result = await processGitHubWebhook(eventType, deliveryId, body);
  return c.json(result, 200);
});
