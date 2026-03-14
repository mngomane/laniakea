import crypto from "node:crypto";
import type { MiddlewareHandler } from "hono";
import { env } from "../config/env.js";

// We store the raw body in a WeakMap keyed by request to avoid Hono variable typing issues
const rawBodies = new Map<string, string>();

export function getRawBody(deliveryId: string): string | undefined {
  return rawBodies.get(deliveryId);
}

export function clearRawBody(deliveryId: string): void {
  rawBodies.delete(deliveryId);
}

export const webhookSignatureMiddleware: MiddlewareHandler = async (c, next) => {
  const signature = c.req.header("X-Hub-Signature-256");
  if (!signature) {
    return c.json({ error: "Missing X-Hub-Signature-256 header" }, 401);
  }

  const body = await c.req.text();
  const expected = "sha256=" +
    crypto
      .createHmac("sha256", env.GITHUB_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return c.json({ error: "Invalid webhook signature" }, 401);
  }

  // Store raw body keyed by delivery ID
  const deliveryId = c.req.header("X-GitHub-Delivery") ?? "";
  if (deliveryId) {
    rawBodies.set(deliveryId, body);
  }

  await next();

  // Cleanup
  if (deliveryId) {
    rawBodies.delete(deliveryId);
  }
};
